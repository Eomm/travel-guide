import styles from './Bar.module.css'

/** Horizontal bar filled to `ratio` (0–1). Decorative: the value is also shown as text. */
export default function Bar({ ratio }: { ratio: number }) {
  const width = `${Math.min(Math.max(ratio, 0), 1) * 100}%`
  return (
    <span className={styles.track} aria-hidden="true">
      <span className={styles.fill} style={{ width }} />
    </span>
  )
}
