// The shared audio player: the track in play, its controls and `useAudio()`. The provider is in AudioProvider.tsx.
import { createContext, useContext } from 'react'
import { resolveResource } from '../data/trips.ts'
import type { AudioTrack } from '../model/trip.gen.ts'

/** What the player needs to play a track and show it on the lock screen. */
export interface PlayerTrack {
  /** Resolved URL (see resolveResource). */
  src: string
  title: string
  /** The place or the stop: the "artist" on the lock screen. */
  artist?: string
  /** The trip: the "album" on the lock screen. */
  album?: string
}

export interface AudioPlayer {
  /** The track loaded in the player, null when the player is closed. */
  track: PlayerTrack | null
  playing: boolean
  /** Load `track` (when it is not the current one) and play it. */
  play: (track: PlayerTrack) => void
  pause: () => void
  /** Move by `seconds`, back when negative. */
  skip: (seconds: number) => void
  /** Go to `seconds` from the start. */
  seek: (seconds: number) => void
  /** Stop and hide the player. */
  close: () => void
}

/** Where the current track is, in seconds: apart from the controls because it changes several times a second. */
export interface AudioProgress {
  current: number
  /** 0 until the browser knows it. */
  duration: number
}

export const AudioPlayerContext = createContext<AudioPlayer | null>(null)
export const AudioProgressContext = createContext<AudioProgress>({ current: 0, duration: 0 })

export function useAudio(): AudioPlayer {
  const audio = useContext(AudioPlayerContext)
  if (!audio) throw new Error('useAudio() must be used inside <AudioProvider>')
  return audio
}

export const useAudioProgress = () => useContext(AudioProgressContext)

/** Seconds skipped by the back / forward buttons and the lock screen. */
export const skipSeconds = 15

/** The same track: a file can be shared, e.g. by a place and a stop with different titles. */
export const isSameTrack = (a: PlayerTrack | null | undefined, b: PlayerTrack | null | undefined) =>
  !!a && !!b && a.src === b.src && a.title === b.title && a.artist === b.artist

/** A track of the trip ready for the player; undefined while it has no file (only a `script`). */
export function playerTrack(track: AudioTrack, slug: string, artist: string, album: string): PlayerTrack | undefined {
  if (!track.src) return undefined
  return { src: resolveResource(slug, track.src), title: track.title, artist, album }
}
