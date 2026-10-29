// Validates every trips/<slug>/trip.json5 (or trip.json): schema, semantic checks and referenced files.
// Usage: node scripts/check-trips.ts [trips-dir]. Exits with 1 when any trip has errors.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import JSON5 from 'json5'
import { checkTrip } from '../src/model/checks.ts'
import { formatIssue, formatPath, type Issue } from '../src/model/issues.ts'
import { isRelativeResource, tripResources } from '../src/model/resources.ts'
import type { Trip } from '../src/model/trip.gen.ts'
import { validateTrip } from '../src/model/validate.ts'

const tripsDir = resolve(process.argv[2] ?? join(import.meta.dirname, '..', 'trips'))

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

function checkTripFolder(tripDir: string): { file?: string; errors: Issue[]; warnings: Issue[] } {
  const files = ['trip.json5', 'trip.json'].filter((name) => existsSync(join(tripDir, name)))
  if (files.length === 0) return { errors: [{ path: '', message: 'no trip.json5 or trip.json' }], warnings: [] }
  if (files.length > 1) return { errors: [{ path: '', message: 'both trip.json5 and trip.json exist' }], warnings: [] }
  const file = join(tripDir, files[0])
  let data: unknown
  try {
    data = JSON5.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    return { file, errors: [{ path: '', message: `cannot parse: ${(error as Error).message}` }], warnings: [] }
  }
  const result = validateTrip(data)
  // Semantic checks assume a schema-valid trip.
  if (!result.ok) return { file, errors: result.issues, warnings: [] }
  const { errors, warnings } = checkTrip(result.trip)
  return { file, errors: [...errors, ...checkFiles(result.trip, tripDir)], warnings }
}

const slugs = readdirSync(tripsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

let errorCount = 0
let warningCount = 0
for (const slug of slugs) {
  const tripDir = join(tripsDir, slug)
  const { file, errors, warnings } = checkTripFolder(tripDir)
  errorCount += errors.length
  warningCount += warnings.length
  const status = errors.length ? `${errors.length} error(s)` : 'ok'
  const shown = relative(process.cwd(), file ?? tripDir)
  console.log(`${shown.startsWith('..') ? (file ?? tripDir) : shown}: ${status}, ${warnings.length} warning(s)`)
  for (const issue of errors) console.log(`  error    ${formatIssue(issue)}`)
  for (const issue of warnings) console.log(`  warning  ${formatIssue(issue)}`)
}

console.log(`\n${slugs.length} trip(s) checked: ${errorCount} error(s), ${warningCount} warning(s)`)
if (errorCount > 0) process.exitCode = 1
