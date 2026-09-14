import { useState } from 'react'

import type { CertificationItem } from '@shared/types/portfolio.types'

import type { FocusEvent } from 'react'

interface CertificationMarqueeProps {
  certifications: readonly CertificationItem[]
  heading: string
}

const FOCUS_RING_PADDING_PX = 8

function revealFocusedBadge(event: FocusEvent<HTMLDivElement>) {
  const badge = event.target
  if (!(badge instanceof HTMLAnchorElement) || !badge.matches(':focus-visible')) {
    return
  }

  // Cancel any smooth scroll started by the previous focused link before deciding
  // whether this badge is already visible.
  window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: 'instant' })
  badge.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  const viewport = event.currentTarget
  const viewportBounds = viewport.getBoundingClientRect()
  const badgeBounds = badge.getBoundingClientRect()
  const leftEdge = viewportBounds.left + FOCUS_RING_PADDING_PX
  const rightEdge = viewportBounds.right - FOCUS_RING_PADDING_PX

  if (badgeBounds.left < leftEdge) {
    viewport.scrollLeft += badgeBounds.left - leftEdge
  } else if (badgeBounds.right > rightEdge) {
    viewport.scrollLeft += badgeBounds.right - rightEdge
  }
}

function resetScrollOnBlur(event: FocusEvent<HTMLDivElement>) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.scrollLeft = 0
  }
}

function CertificationBadge({
  certification,
  isClone,
}: {
  certification: CertificationItem
  isClone: boolean
}) {
  const [hasImageError, setHasImageError] = useState(false)

  return (
    <a
      aria-label={isClone ? undefined : certification.imageAlt}
      className="hero-cert-marquee__badge-link"
      href={certification.credentialUrl}
      rel="noreferrer"
      tabIndex={isClone ? -1 : undefined}
      target="_blank"
    >
      {hasImageError ? (
        <span className="flex h-[100px] w-[100px] items-center justify-center p-3 text-center text-xs font-medium text-slate-700 dark:text-slate-200">
          {certification.imageAlt}
        </span>
      ) : (
        <img
          alt={isClone ? '' : certification.imageAlt}
          className="hero-cert-marquee__badge-image"
          decoding="async"
          height={100}
          loading="lazy"
          onError={() => {
            setHasImageError(true)
          }}
          referrerPolicy="no-referrer"
          src={certification.imageUrl}
          width={100}
        />
      )}
    </a>
  )
}

function CertificationList({
  certifications,
  isClone = false,
}: {
  certifications: readonly CertificationItem[]
  isClone?: boolean
}) {
  return (
    <ul
      aria-hidden={isClone || undefined}
      className="hero-cert-marquee__set"
      data-clone={isClone || undefined}
    >
      {certifications.map((certification) => (
        <li className="shrink-0" key={certification.credentialUrl}>
          <CertificationBadge certification={certification} isClone={isClone} />
        </li>
      ))}
    </ul>
  )
}

export function CertificationMarquee({
  certifications,
  heading,
}: CertificationMarqueeProps) {
  return (
    <section aria-labelledby="hero-certifications-heading" className="mt-8 w-full">
      <h2
        className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent-800 dark:text-accent-300"
        id="hero-certifications-heading"
      >
        {heading}
      </h2>
      <div className="glass-panel hero-cert-marquee">
        <div
          className="hero-cert-marquee__viewport"
          onBlur={resetScrollOnBlur}
          onFocus={revealFocusedBadge}
        >
          <div className="hero-cert-marquee__track">
            <CertificationList certifications={certifications} />
            <CertificationList certifications={certifications} isClone />
          </div>
        </div>
      </div>
    </section>
  )
}
