import type { ErrorObject } from 'ajv'
import { formatPath, type Issue } from './issues.ts'
import type { Trip } from './trip.gen.ts'
import validate, { patternDefs } from './validate-trip.gen.js'

export type ValidationResult = { ok: true; trip: Trip } | { ok: false; issues: Issue[] }

export function validateTrip(data: unknown): ValidationResult {
  if (validate(data)) return { ok: true, trip: data as Trip }
  return { ok: false, issues: toIssues(validate.errors ?? []) }
}

function pointerToSegments(pointer: string): (string | number)[] {
  if (!pointer) return []
  return pointer
    .slice(1)
    .split('/')
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))
    .map((s) => (/^\d+$/.test(s) ? Number(s) : s))
}

// Readable messages for the string formats, by the `$defs` entry that holds the pattern.
const patternMessages: Record<string, string> = {
  id: 'must be an id: letters, digits, - and _ (e.g. "peace-museum")',
  date: 'must be a date YYYY-MM-DD',
  time: 'must be HH:MM',
  localDateTime: 'must be a local date-time YYYY-MM-DDTHH:MM',
  timezone: 'must be an IANA timezone, e.g. Asia/Tokyo',
  language: 'must be a language tag, e.g. it, en, en-GB',
  currency: 'must be an ISO 4217 code, e.g. JPY',
  url: 'must be an http(s) URL',
  openingHours: 'must be a range HH:MM-HH:MM',
}

function message(error: ErrorObject): string {
  const { keyword, params } = error
  switch (keyword) {
    case 'pattern':
      return patternMessages[patternDefs[params.pattern as string]] ?? `must match ${params.pattern}`
    case 'const':
      return `must be ${JSON.stringify(params.allowedValue)}`
    case 'enum':
      return `must be one of: ${(params.allowedValues as unknown[]).join(', ')}`
    case 'type':
      return `must be ${params.type === 'object' || params.type === 'array' ? 'an' : 'a'} ${params.type}`
    default:
      return error.message ?? keyword
  }
}

const isInside = (path: string, parent: string) => path === parent || path.startsWith(`${parent}/`)

function toIssues(errors: ErrorObject[]): Issue[] {
  const issues: Issue[] = []
  // Ajv reports the errors of an anyOf/propertyNames right before the error of the keyword itself.
  // Collect them and emit one summary issue instead.
  let pending: ErrorObject[] = []
  for (const error of errors) {
    const { keyword, params, instancePath } = error
    if (keyword === 'anyOf' || keyword === 'propertyNames') {
      let start = pending.length
      while (start > 0 && isInside(pending[start - 1].instancePath, instancePath)) start--
      const children = pending.slice(start)
      pending = pending.slice(0, start)
      const key = keyword === 'propertyNames' ? [params.propertyName as string] : []
      pending.push({ ...error, message: summary(error, children), keyword: 'summary', params: { key } })
    } else {
      pending.push(error)
    }
  }
  for (const error of pending) {
    const segments = pointerToSegments(error.instancePath)
    const { keyword, params } = error
    if (keyword === 'additionalProperties' || keyword === 'unevaluatedProperties') {
      const key = (params.additionalProperty ?? params.unevaluatedProperty) as string
      issues.push({ path: formatPath([...segments, key]), message: 'unknown key (use an x- prefix for custom data)' })
    } else if (keyword === 'required') {
      issues.push({ path: formatPath([...segments, params.missingProperty as string]), message: 'is required' })
    } else if (keyword === 'summary') {
      issues.push({ path: formatPath([...segments, ...(params.key as string[])]), message: error.message ?? '' })
    } else {
      issues.push({ path: formatPath(segments), message: message(error) })
    }
  }
  return issues
}

// One message for an anyOf/propertyNames error and the errors inside it:
// anyOf of `required` branches (a stop needs placeId or title) → "needs placeId or title";
// otherwise the child messages, e.g. checkIn → "must be a date YYYY-MM-DD or a local date-time …".
function summary(parent: ErrorObject, children: ErrorObject[]): string {
  if (children.length > 0 && children.every((e) => e.keyword === 'required')) {
    const branches = new Map<string, string[]>()
    for (const child of children) {
      const branch = /anyOf\/(\d+)\/required$/.exec(child.schemaPath)?.[1] ?? ''
      branches.set(branch, [...(branches.get(branch) ?? []), child.params.missingProperty as string])
    }
    return `needs ${[...branches.values()].map((keys) => keys.join(' + ')).join(' or ')}`
  }
  const messages = [...new Set(children.map(message))]
  if (messages.length === 0) return parent.message ?? 'is not valid'
  if (messages.every((m) => m.startsWith('must be '))) {
    return `must be ${messages.map((m) => m.slice('must be '.length)).join(' or ')}`
  }
  return messages.join(' or ')
}
