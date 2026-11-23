import { useLayoutEffect, useRef, useState } from 'react'

import { usePointerHover } from '@shared/lib/pointer/usePointerHover'
import type { CertificationItem } from '@shared/types/portfolio.types'

import type { FocusEvent } from 'react'

interface CertificationMarqueeProps {
  certifications: readonly CertificationItem[]
  heading: string
}

const FOCUS_RING_PADDING_PX = 8
const MARQUEE_LOOP_DURATION_MS = 24_000

function revealBadge(badge: HTMLAnchorElement, viewport: HTMLDivElement) {
  // Cancel any smooth scroll started by the previous focused link before deciding
  // whether this badge is already visible.
  window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: 'instant' })
  badge.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
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

function revealFocusedBadge(event: FocusEvent<HTMLDivElement>) {
  const badge = event.target
  if (!(badge instanceof HTMLAnchorElement) || !badge.matches(':focus-visible')) {
    return
  }

  const viewport = event.currentTarget
  revealBadge(badge, viewport)
  // Native focus scrolling may resume after the synchronous focus handler.
  // Correct it once on the next frame, only if this badge still owns focus.
  requestAnimationFrame(() => {
    if (document.activeElement === badge) revealBadge(badge, viewport)
  })
}

function resetScrollOnBlur(event: FocusEvent<HTMLDivElement>) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.scrollLeft = 0
  }
}

function CertificationBadge({
  certification,
  fetchPriority,
  isClone,
}: {
  certification: CertificationItem
  fetchPriority: 'auto' | 'high' | 'low'
  isClone: boolean
}) {
  const [hasImageError, setHasImageError] = useState(false)
  const { pointerHovered, pointerHoverHandlers } = usePointerHover()

  return (
    <a
      aria-label={isClone ? undefined : certification.imageAlt}
      className="hero-cert-marquee__badge-link"
      data-pointer-hover={pointerHovered || undefined}
      href={certification.credentialUrl}
      {...pointerHoverHandlers}
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
          fetchPriority={fetchPriority}
          height={certification.imageHeight ?? 100}
          loading="eager"
          onError={() => {
            setHasImageError(true)
          }}
          referrerPolicy="no-referrer"
          src={certification.imageUrl}
          width={certification.imageWidth ?? 100}
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
      {certifications.map((certification, index) => (
        <li className="shrink-0" key={certification.credentialUrl}>
          <CertificationBadge
            certification={certification}
            fetchPriority={isClone ? 'low' : index === 0 ? 'high' : 'auto'}
            isClone={isClone}
          />
        </li>
      ))}
    </ul>
  )
}

export function CertificationMarquee({
  certifications,
  heading,
}: CertificationMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const track = viewport?.querySelector<HTMLElement>('.hero-cert-marquee__track')
    const originalSet = track?.querySelector<HTMLElement>(
      '.hero-cert-marquee__set:not([data-clone="true"])'
    )
    if (!viewport || !track || !originalSet) return

    const syncEntryTiming = () => {
      const entryDistance = viewport.clientWidth
      const setWidth = originalSet.getBoundingClientRect().width
      if (entryDistance <= 0 || setWidth <= 0) return

      const entryDuration = MARQUEE_LOOP_DURATION_MS * (entryDistance / setWidth)
      track.style.setProperty(
        '--hero-cert-marquee-entry-distance',
        `${String(entryDistance)}px`
      )
      track.style.setProperty(
        '--hero-cert-marquee-entry-duration',
        `${String(entryDuration)}ms`
      )
    }

    syncEntryTiming()
    const observer = new ResizeObserver(syncEntryTiming)
    observer.observe(viewport)
    observer.observe(originalSet)
    return () => {
      observer.disconnect()
    }
  }, [certifications])

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
          ref={viewportRef}
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
