import { useState } from 'react'

import type { CertificationItem } from '@shared/types/portfolio.types'

interface CertificationMarqueeProps {
  certifications: readonly CertificationItem[]
  heading: string
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
        <span className="flex h-[105px] w-[105px] items-center justify-center p-3 text-center text-xs font-medium text-slate-700 dark:text-slate-200">
          {certification.imageAlt}
        </span>
      ) : (
        <img
          alt={isClone ? '' : certification.imageAlt}
          className="hero-cert-marquee__badge-image"
          decoding="async"
          height={certification.imageHeight ?? 105}
          loading="lazy"
          onError={() => {
            setHasImageError(true)
          }}
          referrerPolicy="no-referrer"
          src={certification.imageUrl}
          width={certification.imageWidth ?? 105}
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
    <section aria-labelledby="hero-certifications-heading" className="mt-8 max-w-2xl">
      <h2
        className="mb-3 text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase dark:text-slate-400"
        id="hero-certifications-heading"
      >
        {heading}
      </h2>
      <div className="hero-cert-marquee">
        <div className="hero-cert-marquee__viewport">
          <div className="hero-cert-marquee__track">
            <CertificationList certifications={certifications} />
            <CertificationList certifications={certifications} isClone />
          </div>
        </div>
      </div>
    </section>
  )
}
