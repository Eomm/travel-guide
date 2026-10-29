// Loads every trips/<slug>/trip.json5 (or trip.json): parse, schema, semantic checks and referenced files.
// Shared by check:trips and the Vite plugin.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import JSON5 from 'json5'
import { checkTrip } from '../src/model/checks.ts'
import { formatIssue, formatPath, type Issue } from '../src/model/issues.ts'
import { isRelativeResource, tripResources } from '../src/model/resources.ts'
import type { Trip } from '../src/model/trip.gen.ts'
import { validateTrip } from '../src/model/validate.ts'

export interface TripResult {
  slug: string
  /** Absolute path of the trip folder. */
  dir: string
  /** Absolute path of the trip file, when there is exactly one. */
  file?: string
  /** The parsed trip, when it is schema-valid (it may still have errors from the checks). */
  trip?: Trip
  errors: Issue[]
  warnings: Issue[]
}

// Rule 6: relative files exist in the trip folder (and do not point outside it).
function checkFiles(trip: Trip, tripDir: string): Issue[] {
  const issues: Issue[] = []
  for (const { path, resource } of tripResources(trip)) {
    if (!isRelativeResource(resource)) continue
    const file = resolve(tripDir, resource)
    if (!file.startsWith(tripDir + sep)) {
      issues.push({ path: formatPath(path), message: `"${resource}" is outside the trip folder` })
    } else if (!existsSync(file) || !statSync(file).isFile()) {
      issues.push({ path: formatPath(path), message: `file not found: ${resource}` })
    }
  }
  return issues
}

export function loadTrip(tripDir: string): TripResult {
  const result: TripResult = { slug: tripDir.split(sep).pop()!, dir: tripDir, errors: [], warnings: [] }
  const fail = (message: string) => ({ ...result, errors: [{ path: '', message }] })
  const files = ['trip.json5', 'trip.json'].filter((name) => existsSync(join(tripDir, name)))
  if (files.length === 0) return fail('no trip.json5 or trip.json')
  if (files.length > 1) return fail('both trip.json5 and trip.json exist')
  result.file = join(tripDir, files[0])
  let data: unknown
  try {
    data = JSON5.parse(readFileSync(result.file, 'utf8'))
  } catch (error) {
    return fail(`cannot parse: ${(error as Error).message}`)
  }
  const validation = validateTrip(data)
  // Semantic checks assume a schema-valid trip.
  if (!validation.ok) return { ...result, errors: validation.issues }
  const { errors, warnings } = checkTrip(validation.trip)
  return { ...result, trip: validation.trip, errors: [...errors, ...checkFiles(validation.trip, tripDir)], warnings }
}

/** Loads every folder of `tripsDir`, sorted by slug. */
export function loadTrips(tripsDir: string): TripResult[] {
  const dir = resolve(tripsDir)
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((slug) => loadTrip(join(dir, slug)))
}

export const countIssues = (results: TripResult[], kind: 'errors' | 'warnings') =>
  results.reduce((count, result) => count + result[kind].length, 0)

/** The check:trips report: one block per trip and a summary line. */
export function formatReport(results: TripResult[]): string {
  const lines: string[] = []
  for (const { dir, file, errors, warnings } of results) {
    const status = errors.length ? `${errors.length} error(s)` : 'ok'
    const shown = relative(process.cwd(), file ?? dir)
    lines.push(`${shown.startsWith('..') ? (file ?? dir) : shown}: ${status}, ${warnings.length} warning(s)`)
    for (const issue of errors) lines.push(`  error    ${formatIssue(issue)}`)
    for (const issue of warnings) lines.push(`  warning  ${formatIssue(issue)}`)
  }
  const summary = `${countIssues(results, 'errors')} error(s), ${countIssues(results, 'warnings')} warning(s)`
  lines.push('', `${results.length} trip(s) checked: ${summary}`)
  return lines.join('\n')
}
