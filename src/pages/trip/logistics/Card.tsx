import type { ReactNode } from 'react'
import { ExternalIcon } from '../../../components/icons.tsx'
import styles from './Card.module.css'

export interface CardLink {
  href: string
  label: string
}

interface CardProps {
  icon: ReactNode
  title: ReactNode
  /** Muted line under the title. */
  meta?: ReactNode
  /** `<Fact>` rows. */
  children?: ReactNode
  notes?: string
  /** Extra content after the notes (e.g. the itinerary link of a reservation). */
  footer?: ReactNode
  /** External links, opened in a new tab. */
  links?: CardLink[]
}

/** One logistics item: icon and title, a list of facts, notes and external links. */
export default function Card({ icon, title, meta, children, notes, footer, links = [] }: CardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <span className={styles.icon}>{icon}</span>
        <div className={styles.headText}>
          <h3 className={styles.title}>{title}</h3>
          {meta && <p className={styles.meta}>{meta}</p>}
        </div>
      </div>
      {children && <dl className={styles.facts}>{children}</dl>}
      {notes && <p className={styles.notes}>{notes}</p>}
      {footer}
      {links.length > 0 && (
        <div className={styles.links}>
          {links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={styles.link}>
              {link.label}
              <ExternalIcon />
            </a>
          ))}
        </div>
      )}
    </article>
  )
}

/** A label / value row of a card. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
