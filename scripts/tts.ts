// Text-to-speech tracks of a trip: the tracks with a `script` and no `src`, their voice and their file.
// Shared by the generator (scripts/generate-audio.ts) and the build (scripts/load-trips.ts, scripts/vite-plugin-trips.ts),
// so both name the file the same way.
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { formatPath, type Issue } from '../src/model/issues.ts'
import type { AudioTrack, Trip } from '../src/model/trip.gen.ts'
import { ttsDir } from '../src/model/tts.ts'

/** The Ollama model that reads the scripts. */
export const ttsModel = 'lfm3-audio'

// BCP 47 tag (or its language) → language of the model voices (`ollama show lfm3-audio`)
const voiceLanguages: Record<string, string> = {
  ar: 'arabic',
  da: 'danish',
  de: 'german',
  el: 'greek',
  en: 'english',
  'en-GB': 'british-english',
  'en-US': 'american-english',
  es: 'spanish',
  fi: 'finnish',
  fr: 'french',
  he: 'hebrew',
  it: 'italian',
  ja: 'japanese',
  ko: 'korean',
  nl: 'dutch',
  pl: 'polish',
  pt: 'portuguese',
  sv: 'swedish',
  tr: 'turkish',
  zh: 'chinese',
}

export interface TtsTrack {
  /** Path of the track in the trip file, e.g. `['days', 0, 'stops', 1, 'audio', 0]`. */
  path: (string | number)[]
  track: AudioTrack
  text: string
  language: string
  /** Ollama voice, e.g. `female-italian`; just the gender when the model has no voice for the language. */
  voice: string
  /** sha256 of model, voice and text: a change to any of them makes a new file. */
  hash: string
  /** Path relative to the trip folder: `audio/tts/<hash>.mp3`. */
  file: string
}

function ttsTrack(trip: Trip, track: AudioTrack, path: (string | number)[]): TtsTrack {
  const text = track.script!
  const language = track.language ?? trip.trip.language
  const voiceLanguage = voiceLanguages[language] ?? voiceLanguages[language.split('-')[0]]
  const gender = track.voice ?? 'female'
  const voice = voiceLanguage ? `${gender}-${voiceLanguage}` : gender
  const hash = createHash('sha256').update(JSON.stringify({ model: ttsModel, voice, text })).digest('hex')
  return { path, track, text, language, voice, hash, file: `${ttsDir}/${hash}.mp3` }
}

/**
 * The tracks to read, following the itinerary: day by day, each stop's audio and then its place's audio (a place
 * comes once, at its first stop), then the places in no day. Generated in this order, an interrupted run leaves
 * the first days ready.
 */
export function ttsTracks(trip: Trip): TtsTrack[] {
  const found: TtsTrack[] = []
  const add = (audio: AudioTrack[] | undefined, ...path: (string | number)[]) =>
    audio?.forEach((track, a) => {
      if (track.script && !track.src) found.push(ttsTrack(trip, track, [...path, 'audio', a]))
    })
  const seen = new Set<number>()
  const addPlace = (p: number) => {
    if (p < 0 || seen.has(p)) return
    seen.add(p)
    add(trip.places[p].audio, 'places', p)
  }
  trip.days.forEach((day, d) =>
    day.stops.forEach((stop, s) => {
      add(stop.audio, 'days', d, 'stops', s)
      if (stop.placeId !== undefined) addPlace(trip.places.findIndex((place) => place.id === stop.placeId))
    }),
  )
  trip.places.forEach((_, p) => addPlace(p))
  return found
}

/** Warnings for the tracks still without their file, or without a voice for their language. */
export function ttsIssues(trip: Trip, tripDir: string): Issue[] {
  return ttsTracks(trip).flatMap(({ path, file, language, voice }) => [
    ...(existsSync(join(tripDir, file)) ? [] : [{ path: formatPath(path), message: 'audio not generated yet: run npm run audio' }]),
    ...(voice.includes('-') ? [] : [{ path: formatPath(path), message: `no text-to-speech voice for language "${language}": read with the default one` }]),
  ])
}

/** The trip as published: each track with a generated file gets it as `src`, and its script as transcript if it has none. */
export function withGeneratedAudio(trip: Trip, tripDir: string): Trip {
  const generated = new Map<AudioTrack, TtsTrack>()
  for (const tts of ttsTracks(trip)) if (existsSync(join(tripDir, tts.file))) generated.set(tts.track, tts)
  if (!generated.size) return trip
  const resolve = (audio: AudioTrack[] | undefined) =>
    audio?.map((track) => {
      const tts = generated.get(track)
      return tts ? { ...track, src: tts.file, transcript: track.transcript ?? tts.text } : track
    })
  return {
    ...trip,
    places: trip.places.map((place) => (place.audio ? { ...place, audio: resolve(place.audio) } : place)),
    days: trip.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => (stop.audio ? { ...stop, audio: resolve(stop.audio) } : stop)),
    })),
  }
}
