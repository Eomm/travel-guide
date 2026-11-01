import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AudioPlayerContext, AudioProgressContext, isSameTrack, skipSeconds, type AudioPlayer, type AudioProgress, type PlayerTrack } from './audio.ts'

const stopped: AudioProgress = { current: 0, duration: 0 }

function seekTo(audio: HTMLAudioElement, seconds: number) {
  const end = Number.isFinite(audio.duration) ? audio.duration : Infinity
  audio.currentTime = Math.min(Math.max(seconds, 0), end)
}

// rejected when a pause or another track comes first, or the file cannot be played: the events keep `playing` right
const start = (audio: HTMLAudioElement) => audio.play().catch(() => {})

/** Tells the lock screen where the track is: it moves the position on by itself while playing. */
function updatePositionState(audio: HTMLAudioElement) {
  if (!('mediaSession' in navigator) || !Number.isFinite(audio.duration)) return
  navigator.mediaSession.setPositionState({
    duration: audio.duration,
    playbackRate: audio.playbackRate,
    position: Math.min(audio.currentTime, audio.duration),
  })
}

function setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
  try {
    navigator.mediaSession.setActionHandler(action, handler)
  } catch {
    // action not supported by this browser
  }
}

/**
 * One `<audio>` for the whole trip: it keeps playing while the user moves between the pages,
 * and shows its track and controls on the lock screen (Media Session API).
 */
export default function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [track, setTrack] = useState<PlayerTrack | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState<AudioProgress>(stopped)

  const player = useMemo<AudioPlayer>(() => {
    // the element is always rendered: the controls only run after the first render
    const audio = () => audioRef.current!
    return {
      track,
      playing,
      play: (next) => {
        if (!isSameTrack(next, track)) {
          audio().src = next.src
          setTrack(next)
          setProgress(stopped)
        }
        void start(audio())
      },
      pause: () => audio().pause(),
      skip: (seconds) => seekTo(audio(), audio().currentTime + seconds),
      seek: (seconds) => seekTo(audio(), seconds),
      close: () => {
        audio().pause()
        audio().removeAttribute('src')
        audio().load()
        setTrack(null)
        setProgress(stopped)
      },
    }
  }, [track, playing])

  // lock screen: what is playing and its buttons
  useEffect(() => {
    const audio = audioRef.current
    if (!track || !audio || !('mediaSession' in navigator)) return
    const session = navigator.mediaSession
    session.metadata = new MediaMetadata({ title: track.title, artist: track.artist ?? '', album: track.album ?? '' })
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => void start(audio)],
      ['pause', () => audio.pause()],
      ['seekbackward', (details) => seekTo(audio, audio.currentTime - (details.seekOffset ?? skipSeconds))],
      ['seekforward', (details) => seekTo(audio, audio.currentTime + (details.seekOffset ?? skipSeconds))],
      ['seekto', (details) => details.seekTime !== undefined && seekTo(audio, details.seekTime)],
    ]
    for (const [action, handler] of handlers) setActionHandler(action, handler)
    return () => {
      session.metadata = null
      for (const [action] of handlers) setActionHandler(action, null)
    }
  }, [track])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const session = navigator.mediaSession
    session.playbackState = !track ? 'none' : playing ? 'playing' : 'paused'
    // leaving the trip removes the <audio>, which stops it
    return () => {
      session.playbackState = 'none'
    }
  }, [track, playing])

  const onTime = (audio: HTMLAudioElement) =>
    setProgress({ current: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : 0 })

  return (
    <AudioPlayerContext value={player}>
      <AudioProgressContext value={progress}>
        {children}
        <audio
          ref={audioRef}
          preload="metadata"
          onPlay={(event) => {
            setPlaying(true)
            updatePositionState(event.currentTarget)
          }}
          onPause={(event) => {
            setPlaying(false)
            updatePositionState(event.currentTarget)
          }}
          onTimeUpdate={(event) => onTime(event.currentTarget)}
          onDurationChange={(event) => onTime(event.currentTarget)}
          onLoadedMetadata={(event) => updatePositionState(event.currentTarget)}
          onSeeked={(event) => updatePositionState(event.currentTarget)}
          onRateChange={(event) => updatePositionState(event.currentTarget)}
        />
      </AudioProgressContext>
    </AudioPlayerContext>
  )
}
