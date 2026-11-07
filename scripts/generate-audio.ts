// Generates the text-to-speech audio of the trips with the local Ollama model: every audio track with a `script`
// and no `src` becomes trips/<slug>/audio/tts/<hash>.mp3 (scripts/tts.ts), following the itinerary. Existing files
// are skipped, and the files no track uses any more are deleted. The trip files are never rewritten: the build
// publishes the generated file as the track's src.
// Usage: node scripts/generate-audio.ts [--trip <slug>] [--dry-run] [--limit <n>]
// OLLAMA_URL: the Ollama server (default http://localhost:11434). In GitHub Actions it writes `pending=<n>` (the
// files to generate) to GITHUB_OUTPUT.
import { appendFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseArgs } from 'node:util'
import { Mp3Encoder } from '@breezystack/lamejs'
import { formatPath } from '../src/model/issues.ts'
import { ttsDir } from '../src/model/tts.ts'
import { loadTrips } from './load-trips.ts'
import { ttsModel, ttsTracks, type TtsTrack } from './tts.ts'

const ollamaUrl = (process.env.OLLAMA_URL ?? 'http://localhost:11434').replace(/\/$/, '')
// The model answers with raw 16-bit little-endian mono samples at 24 kHz (the same format as its WAV output).
const sampleRate = 24000
// One request reads at most 180 s of audio (about 2900 characters) and cuts the rest: longer scripts are read in
// chunks of at most this many characters (about a minute each), split at paragraphs, sentences, then commas.
const maxChars = 1000
const maxAudioSec = 180
// silence between two chunks
const pauseSec = 0.4
// mono MP3, plenty for speech
const kbps = 64

const { values: options } = parseArgs({
  options: {
    trip: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    limit: { type: 'string' },
  },
})
const limit = options.limit === undefined ? Infinity : Number(options.limit)
if (limit !== Infinity && !(Number.isInteger(limit) && limit >= 0)) fail(`--limit must be a whole number, not "${options.limit}"`)

function fail(message: string): never {
  console.error(`error: ${message}`)
  process.exit(1)
}

const breaks = [/(?<=[.!?…])\s+|(?<=[。！？])/, /(?<=[,;:])\s+|(?<=[、，；：])/, /\s+/]

/** Splits a text that is too long at the first kind of break that makes the pieces short enough. */
function pieces(text: string, level = 0): string[] {
  if (text.length <= maxChars) return [text]
  if (level === breaks.length) return text.match(new RegExp(`[^]{1,${maxChars}}`, 'g'))!
  return text
    .split(breaks[level])
    .filter((piece) => piece.trim())
    .flatMap((piece) => pieces(piece, level + 1))
}

/** The chunks to read, each at most `maxChars` long: whole paragraphs and sentences, as many as fit. */
function splitScript(text: string): string[] {
  const chunks: string[] = []
  let current = ''
  for (const paragraph of text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
    pieces(paragraph).forEach((piece, i) => {
      const separator = i === 0 ? '\n\n' : ' '
      if (current && current.length + separator.length + piece.length > maxChars) {
        chunks.push(current)
        current = ''
      }
      current = current ? current + separator + piece : piece
    })
  }
  if (current) chunks.push(current)
  return chunks
}

async function checkOllama() {
  let response: Response
  try {
    response = await fetch(`${ollamaUrl}/api/show`, { method: 'POST', body: JSON.stringify({ model: ttsModel }) })
  } catch {
    fail(`Ollama is not reachable at ${ollamaUrl}: start it (ollama serve) or set OLLAMA_URL`)
  }
  if (response.status === 404) fail(`Ollama has no ${ttsModel} model: run ollama pull ${ttsModel}`)
  if (!response.ok) fail(`Ollama answered ${response.status}: ${await response.text()}`)
}

async function speak(text: string, voice: string): Promise<Int16Array> {
  const response = await fetch(`${ollamaUrl}/v1/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: ttsModel, input: text, voice, response_format: 'pcm' }),
  })
  if (!response.ok) throw new Error(`Ollama answered ${response.status}: ${await response.text()}`)
  const bytes = await response.arrayBuffer()
  const samples = new Int16Array(bytes, 0, bytes.byteLength >> 1)
  if (samples.length >= (maxAudioSec - 1) * sampleRate) throw new Error(`the audio was cut at ${maxAudioSec} s: lower maxChars`)
  return samples
}

/** Reads the script chunk by chunk and joins the samples with a short pause. */
async function read({ text, voice }: TtsTrack): Promise<Int16Array> {
  const parts: Int16Array[] = []
  for (const chunk of splitScript(text)) parts.push(await speak(chunk, voice))
  const pause = Math.round(pauseSec * sampleRate)
  const samples = new Int16Array(parts.reduce((total, part) => total + part.length, 0) + pause * (parts.length - 1))
  let offset = 0
  for (const part of parts) {
    samples.set(part, offset)
    offset += part.length + pause
  }
  return samples
}

function encodeMp3(samples: Int16Array): Buffer {
  const encoder = new Mp3Encoder(1, sampleRate, kbps)
  const frames: Buffer[] = []
  // lamejs returns an Int8Array (typed as Uint8Array): view its bytes as a Buffer
  const add = (bytes: Uint8Array) => frames.push(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength))
  // 1152 samples per MP3 frame
  for (let i = 0; i < samples.length; i += 1152) add(encoder.encodeBuffer(samples.subarray(i, i + 1152)))
  add(encoder.flush())
  return Buffer.concat(frames)
}

interface Job {
  slug: string
  dir: string
  tts: TtsTrack
}

const results = loadTrips(join(import.meta.dirname, '..', 'trips')).filter(({ slug }) => !options.trip || slug === options.trip)
if (options.trip && !results.length) fail(`no trip "${options.trip}" in trips/`)

const missing: Job[] = []
const stale: string[] = []
let skipped = 0
for (const { slug, dir, trip, errors } of results) {
  if (!trip || errors.length) {
    console.warn(`${slug}: left out, it has errors (see npm run check:trips)`)
    continue
  }
  // a text read twice with the same voice is one file
  const tracks = new Map<string, TtsTrack>()
  for (const tts of ttsTracks(trip)) if (!tracks.has(tts.hash)) tracks.set(tts.hash, tts)
  for (const tts of tracks.values()) {
    if (existsSync(join(dir, tts.file))) skipped++
    else missing.push({ slug, dir, tts })
  }
  const folder = join(dir, ttsDir)
  if (existsSync(folder)) {
    for (const name of readdirSync(folder)) if (!tracks.has(name.replace(/\.mp3$/, ''))) stale.push(join(folder, name))
  }
}
const jobs = missing.slice(0, limit)
const left = missing.length - jobs.length
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `pending=${jobs.length}\n`)

const describe = ({ slug, tts }: Job) => `${slug} ${formatPath(tts.path)} "${tts.track.title}" (${tts.voice}, ${tts.text.length} characters)`
const shown = (file: string) => relative(process.cwd(), file)

if (options['dry-run']) {
  for (const job of jobs) console.log(`would generate  ${describe(job)}`)
  for (const file of stale) console.log(`would delete    ${shown(file)}`)
  console.log(`\n${jobs.length} to generate, ${skipped} already generated, ${stale.length} to delete${left ? `, ${left} left out by --limit` : ''}`)
  process.exit(0)
}

for (const file of stale) {
  rmSync(file)
  console.log(`deleted  ${shown(file)}`)
}
if (jobs.length) await checkOllama()
let audioSec = 0
const started = performance.now()
for (const [i, job] of jobs.entries()) {
  console.log(`[${i + 1}/${jobs.length}] ${describe(job)}`)
  const start = performance.now()
  const samples = await read(job.tts).catch((error: Error) => fail(`${describe(job)}: ${error.message}`))
  const file = join(job.dir, job.tts.file)
  mkdirSync(join(job.dir, ttsDir), { recursive: true })
  // written aside and renamed, so an interrupted run never leaves a partial file that looks generated
  writeFileSync(`${file}.part`, encodeMp3(samples))
  renameSync(`${file}.part`, file)
  audioSec += samples.length / sampleRate
  const took = (performance.now() - start) / 1000
  console.log(`  ${shown(file)}: ${(samples.length / sampleRate).toFixed(1)} s of audio in ${took.toFixed(1)} s`)
}
const total = jobs.length ? ` (${audioSec.toFixed(0)} s of audio in ${((performance.now() - started) / 1000).toFixed(0)} s)` : ''
console.log(`\n${jobs.length} generated${total}, ${skipped} already generated, ${stale.length} deleted${left ? `, ${left} left out by --limit` : ''}`)
