// Validates every trips/<slug>/trip.json5 (or trip.json): schema, semantic checks and referenced files.
// Usage: node scripts/check-trips.ts [trips-dir]. Exits with 1 when any trip has errors.
import { join, resolve } from 'node:path'
import { countIssues, formatReport, loadTrips } from './load-trips.ts'

const tripsDir = resolve(process.argv[2] ?? join(import.meta.dirname, '..', 'trips'))
const results = loadTrips(tripsDir)

console.log(formatReport(results))
if (countIssues(results, 'errors') > 0) process.exitCode = 1
