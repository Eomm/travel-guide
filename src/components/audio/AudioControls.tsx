// Controls of the shared audio player (src/audio/), used by the mini player and next to the tracks.
import type { ReactNode } from 'react'
import { isSameTrack, useAudio, useAudioProgress, type PlayerTrack } from '../../audio/audio.ts'
import { useI18n } from '../../i18n/i18n.ts'
import { formatClock } from '../../model/format.ts'
import { PauseIcon, PlayIcon } from '../icons.tsx'
import styles from './AudioControls.module.css'

interface PlayButtonProps {
  track: PlayerTrack
  className?: string
  /** Visible label next to the icon; without it the button shows only the icon. */
  children?: ReactNode
}

/** Plays `track` in the shared player, or pauses it while it is playing. */
export function PlayButton({ track, className, children }: PlayButtonProps) {
  const { track: current, playing, play, pause } = useAudio()
  const { t } = useI18n()
  const active = playing && isSameTrack(current, track)
  const label = t(active ? 'audio.pause' : 'audio.play', { title: track.title })
  return (
    <button type="button" className={className} onClick={() => (active ? pause() : play(track))}
      aria-label={label} title={children ? undefined : label}>
      {active ? <PauseIcon /> : <PlayIcon />}
      {children}
    </button>
  )
}

/** Elapsed time, a slider to move in the current track, and its length. */
export function SeekBar() {
  const { seek } = useAudio()
  const { current, duration } = useAudioProgress()
  const { t } = useI18n()
  return (
    <div className={styles.seek}>
      <span className={styles.time}>{formatClock(current)}</span>
      <input
        type="range"
        className={styles.range}
        min={0}
        max={Math.floor(duration)}
        step={1}
        value={Math.floor(current)}
        disabled={duration === 0}
        onChange={(event) => seek(Number(event.currentTarget.value))}
        aria-label={t('audio.seek')}
        aria-valuetext={t('audio.position', { current: formatClock(current), duration: formatClock(duration) })}
      />
      <span className={styles.time}>{formatClock(duration)}</span>
    </div>
  )
}
