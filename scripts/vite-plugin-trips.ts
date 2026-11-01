// Vite plugin that publishes the trips as static data under `<base>data/`:
//   data/index.json          list of TripSummary, sorted by startDate
//   data/<slug>/trip.json    the validated trip as plain JSON (without `$schema`)
//   data/<slug>/<path>       every relative resource of the trip (cover, image, audio src)
// `vite build` emits these files and fails when a trip has errors; `vite dev` serves them from memory,
// reloads on changes in the trips folder and shows the errors in the overlay (invalid trips are left out).
import { createReadStream, readFileSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, posix, resolve, sep } from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import type { TripSummary } from '../src/model/trip-index.ts'
import { isRelativeResource, tripResources } from '../src/model/resources.ts'
import type { Trip } from '../src/model/trip.gen.ts'
import { countIssues, formatReport, loadTrips, type TripResult } from './load-trips.ts'

/** A JSON file built in memory, or a file copied from the trip folder. */
export type OutputFile = { source: string } | { file: string }

/** The index entries of the valid trips, sorted by startDate. */
export function tripIndex(trips: { slug: string; trip: Trip }[]): TripSummary[] {
  return trips
    .map(({ slug, trip: { trip } }) => ({
      slug,
      title: trip.title,
      subtitle: trip.subtitle,
      startDate: trip.startDate,
      endDate: trip.endDate,
      cover: trip.cover,
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

/** Every file published under `data/`, keyed by its path relative to `data/`. Trips with errors are left out. */
export function outputFiles(results: TripResult[]): Map<string, OutputFile> {
  const valid = results.flatMap(({ slug, dir, trip, errors }) => (trip && !errors.length ? [{ slug, dir, trip }] : []))
  const files = new Map<string, OutputFile>([['index.json', { source: JSON.stringify(tripIndex(valid)) }]])
  for (const { slug, dir, trip } of valid) {
    // `$schema` is a path for editors, meaningless once published.
    files.set(`${slug}/trip.json`, { source: JSON.stringify({ ...trip, $schema: undefined }) })
    for (const { resource } of tripResources(trip)) {
      if (isRelativeResource(resource)) files.set(posix.join(slug, resource), { file: resolve(dir, resource) })
    }
  }
  return files
}

const contentTypes: Record<string, string> = {
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

/**
 * Streams a trip file, honouring a single `Range: bytes=…` request: without it the browser can't seek
 * in an audio file (setting `currentTime` jumps back to the start).
 */
function sendFile(req: IncomingMessage, res: ServerResponse, file: string, next: (error?: unknown) => void) {
  const size = statSync(file).size
  res.setHeader('Accept-Ranges', 'bytes')
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
  if (!range || (!range[1] && !range[2])) {
    res.setHeader('Content-Length', size)
    return createReadStream(file).on('error', next).pipe(res)
  }
  // `bytes=500-` from 500 to the end, `bytes=-500` the last 500 bytes
  const start = range[1] ? Number(range[1]) : Math.max(size - Number(range[2]), 0)
  const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
  if (start > end) {
    res.statusCode = 416
    res.setHeader('Content-Range', `bytes */${size}`)
    return res.end()
  }
  res.statusCode = 206
  res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
  res.setHeader('Content-Length', end - start + 1)
  createReadStream(file, { start, end }).on('error', next).pipe(res)
}

export default function trips({ dir = 'trips' } = {}): Plugin {
  let tripsDir = ''
  let isBuild = false
  let results: TripResult[] = []

  function serve(server: ViteDevServer) {
    const prefix = `${server.config.base}data/`
    let files = new Map<string, OutputFile>()
    const load = () => {
      results = loadTrips(tripsDir)
      files = outputFiles(results)
      const { logger } = server.config
      if (countIssues(results, 'errors')) logger.error(`Invalid trips:\n${formatReport(results)}`)
      else if (countIssues(results, 'warnings')) logger.warn(formatReport(results))
      else logger.info(`${results.length} trip(s) loaded`, { timestamp: true })
    }
    const showErrors = () => {
      if (!countIssues(results, 'errors')) return
      server.ws.send({ type: 'error', err: { message: formatReport(results), stack: '', plugin: 'trips' } })
    }

    load()
    // After a reload the page connects again and gets the overlay with the current errors.
    server.ws.on('connection', showErrors)
    server.watcher.add(tripsDir)
    // One save fires several events (add, change, unlink…): reload once they settle.
    let timer: ReturnType<typeof setTimeout> | undefined
    server.watcher.on('all', (_event, file) => {
      if (!file.startsWith(tripsDir + sep)) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        load()
        server.ws.send({ type: 'full-reload' })
      }, 100)
    })
    server.middlewares.use((req, res, next) => {
      const pathname = decodeURIComponent(new URL(req.url ?? '', 'http://localhost').pathname)
      if (!pathname.startsWith(prefix)) return next()
      const output = files.get(pathname.slice(prefix.length))
      if (!output) {
        res.statusCode = 404
        return res.end('Not found')
      }
      const path = 'file' in output ? output.file : pathname
      res.setHeader('Content-Type', contentTypes[extname(path).toLowerCase()] ?? 'application/octet-stream')
      if ('file' in output) sendFile(req, res, output.file, next)
      else res.end(output.source)
    })
  }

  return {
    name: 'trips',
    configResolved(config) {
      tripsDir = resolve(config.root, dir)
      isBuild = config.command === 'build'
    },
    configureServer: serve,
    buildStart() {
      if (!isBuild) return
      results = loadTrips(tripsDir)
      if (countIssues(results, 'errors')) this.error(`Invalid trips:\n${formatReport(results)}`)
      if (countIssues(results, 'warnings')) this.warn(formatReport(results))
    },
    generateBundle() {
      for (const [path, output] of outputFiles(results)) {
        const source = 'file' in output ? readFileSync(output.file) : output.source
        this.emitFile({ type: 'asset', fileName: `data/${path}`, source })
      }
    },
  }
}
