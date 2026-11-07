import type { AudioTrack, Trip } from './trip.gen.ts'

/** Folder of the trip where `npm run audio` writes the text-to-speech files (scripts/generate-audio.ts). */
export const ttsDir = 'audio/tts'

const isGenerated = (track: AudioTrack) => !!track.script && !!track.src?.startsWith(`${ttsDir}/`)

/**
 * The trip as written, from its published data: the build gives a track with a `script` the generated file as
 * `src` and the script as `transcript` (scripts/tts.ts), and both would stop the audio from being generated again
 * when the script changes.
 */
export function withoutGeneratedAudio(trip: Trip): Trip {
  const strip = (audio: AudioTrack[] | undefined) =>
    audio?.map((track) => {
      if (!isGenerated(track)) return track
      const written = { ...track }
      delete written.src
      if (written.transcript === written.script) delete written.transcript
      return written
    })
  return {
    ...trip,
    places: trip.places.map((place) => (place.audio ? { ...place, audio: strip(place.audio) } : place)),
    days: trip.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => (stop.audio ? { ...stop, audio: strip(stop.audio) } : stop)),
    })),
  }
}
