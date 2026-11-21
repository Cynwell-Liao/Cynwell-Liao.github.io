import { m } from 'framer-motion'
import { useState } from 'react'

import { cn } from '@shared/lib/cn'
import { cardReveal } from '@shared/lib/motion'
import { SECTION_ID } from '@shared/lib/navigation'
import { SectionHeading } from '@shared/ui/SectionHeading'

import type { EducationItem } from '../model/education.types'
import type { CSSProperties } from 'react'

interface EducationSectionProps {
  education: readonly EducationItem[]
  headingEyebrow: string
  headingTitle: string
  headingDescription: string
}

function EducationLogo({
  logoColor,
  logoUrl,
}: {
  logoColor: string | undefined
  logoUrl: string | undefined
}) {
  const [hasLogoError, setHasLogoError] = useState(false)

  if (!logoUrl || hasLogoError) {
    return null
  }

  return (
    <div className="mt-1 flex-shrink-0 sm:mt-0">
      <span
        aria-hidden="true"
        className="education-brand-tile brand-logo-tile inline-flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-[transform,border-color] duration-300 group-hover:scale-110"
        style={
          logoColor
            ? ({
                '--brand-logo-color': logoColor,
              } as CSSProperties)
            : undefined
        }
      >
        <img
          alt=""
          className="h-6 w-6 object-contain"
          decoding="async"
          height={24}
          loading="lazy"
          onError={() => {
            setHasLogoError(true)
          }}
          referrerPolicy="no-referrer"
          src={logoUrl}
          width={24}
        />
      </span>
    </div>
  )
}

export function EducationSection({
  education,
  headingEyebrow,
  headingTitle,
  headingDescription,
}: EducationSectionProps) {
  return (
    <section
      aria-labelledby="education-heading"
      className="section-wrap relative z-10 scroll-mt-24 py-24"
      id={SECTION_ID.education}
    >
      <div
        aria-hidden="true"
        className="ambient-glow ambient-glow--diffuse absolute top-1/2 left-0 h-96 w-96 text-accent-500/10"
      />

      <SectionHeading
        description={headingDescription}
        eyebrow={headingEyebrow}
        id="education-heading"
        title={headingTitle}
      />

      <div className="relative z-10 mt-12 grid gap-6 md:grid-cols-2 lg:gap-8">
        {education.map((item, index) => {
          // The first item (Master's) spans two columns on medium screens and up
          const isHero = index === 0

          return (
            <m.article
              {...cardReveal(index * 0.15)}
              className={cn(
                'glass-panel group flex flex-col p-8',
                isHero ? 'md:col-span-2' : 'md:col-span-1'
              )}
              key={item.institution}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-10"
                style={
                  item.color
                    ? {
                        background: `radial-gradient(circle at top right, ${item.color}, transparent 70%)`,
                      }
                    : undefined
                }
              />

              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-3">
                    <EducationLogo logoColor={item.color} logoUrl={item.logoUrl} />
                    <h3
                      className="education-brand-title text-xl font-bold tracking-tight text-slate-900 transition-colors dark:text-white"
                      style={
                        item.color
                          ? ({
                              '--brand-logo-color': item.color,
                            } as CSSProperties)
                          : undefined
                      }
                    >
                      {item.institution}
                    </h3>
                  </div>
                </div>

                <div className="mb-6 flex flex-col gap-1 border-b border-slate-200 pb-6 dark:border-white/10">
                  <span className="text-base leading-snug font-semibold text-slate-900 dark:text-slate-100">
                    {item.degree}
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="w-fit rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs leading-none font-mono text-accent-600 dark:border-white/10 dark:bg-white/5 dark:text-accent-400">
                      {item.duration}
                    </span>
                    {item.location && (
                      <span className="text-sm leading-snug font-normal text-slate-500 dark:text-slate-400">
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mt-auto space-y-3">
                  {item.achievements.map((achievement) => (
                    <li
                      className="flex items-start gap-3 text-sm leading-snug font-normal text-slate-600 dark:text-slate-400"
                      key={achievement}
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                        style={
                          item.color
                            ? {
                                backgroundColor: item.color,
                                boxShadow: `0 0 8px ${item.color}`,
                              }
                            : { backgroundColor: '#e384b2' }
                        }
                      />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </m.article>
          )
        })}
      </div>
    </section>
  )
}
