import { skipSeconds, useAudio } from '../../audio/audio.ts'
import { useI18n } from '../../i18n/i18n.ts'
import { Back15Icon, CloseIcon, Forward15Icon } from '../icons.tsx'
import { PlayButton, SeekBar } from './AudioControls.tsx'
import styles from './MiniPlayer.module.css'

/** The track in play, fixed above the tab bar while the user moves between the pages. Nothing when no track is loaded. */
export default function MiniPlayer() {
  const { track, skip, close } = useAudio()
  const { t } = useI18n()
  if (!track) return null
  const back = t('audio.back', { seconds: skipSeconds })
  const forward = t('audio.forward', { seconds: skipSeconds })
  return (
    <section className={styles.player} aria-label={t('audio.player')}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <PlayButton track={track} className={`${styles.button} ${styles.play}`} />
          <p className={styles.info}>
            <span className={styles.title}>{track.title}</span>
            {track.artist && <span className={styles.artist}>{track.artist}</span>}
          </p>
          <button type="button" className={styles.button} onClick={() => skip(-skipSeconds)} aria-label={back} title={back}>
            <Back15Icon />
          </button>
          <button type="button" className={styles.button} onClick={() => skip(skipSeconds)} aria-label={forward} title={forward}>
            <Forward15Icon />
          </button>
          <button type="button" className={styles.button} onClick={close} aria-label={t('audio.close')} title={t('audio.close')}>
            <CloseIcon />
          </button>
        </div>
        <SeekBar />
      </div>
    </section>
  )
}
