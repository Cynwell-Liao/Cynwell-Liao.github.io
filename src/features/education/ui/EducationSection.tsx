import { m } from 'framer-motion'
import { createElement, useState } from 'react'

import { cn } from '@shared/lib/cn'
import { resolveIcon } from '@shared/lib/icons'
import { SectionHeading } from '@shared/ui/SectionHeading'

import type { EducationItem } from '../model/education.types'

interface EducationSectionProps {
  education: readonly EducationItem[]
  headingEyebrow: string
  headingTitle: string
  headingDescription: string
}

function EducationBrandMark({ item }: { item: EducationItem }) {
  const [hasLogoError, setHasLogoError] = useState(false)
  const Icon = resolveIcon(item.icon)
  const shouldShowLogo = Boolean(item.logoUrl) && !hasLogoError

  if (!shouldShowLogo && !Icon) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 dark:border-white/10',
        shouldShowLogo ? 'p-0' : 'p-1.5'
      )}
      style={
        item.color && !shouldShowLogo
          ? { color: item.color, borderColor: `${item.color}40` }
          : undefined
      }
    >
      {shouldShowLogo && item.logoUrl ? (
        <img
          alt=""
          className="h-full w-full scale-110 object-cover mix-blend-multiply dark:mix-blend-normal"
          decoding="async"
          height={56}
          loading="lazy"
          onError={() => {
            setHasLogoError(true)
          }}
          referrerPolicy="no-referrer"
          src={item.logoUrl}
          width={56}
        />
      ) : Icon ? (
        createElement(Icon, { 'aria-hidden': true, className: 'h-7 w-7' })
      ) : null}
    </span>
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
      id="education"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-0 h-96 w-96 rounded-full bg-accent-500/10 mix-blend-screen blur-[150px]"
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
              className={cn(
                'glass-panel group flex flex-col p-8 md:p-10',
                isHero ? 'md:col-span-2' : 'md:col-span-1'
              )}
              initial={{ opacity: 0, y: 30 }}
              key={item.institution}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true, amount: 0.2 }}
              whileInView={{ opacity: 1, y: 0 }}
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
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start dark:border-white/10">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-accent-600 sm:text-3xl dark:text-white dark:group-hover:text-accent-300">
                      {item.institution}
                    </h3>
                    {item.location && (
                      <span className="text-sm font-medium tracking-wide text-slate-500 capitalize dark:text-slate-400">
                        {item.location}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex-shrink-0 sm:mt-0">
                    <EducationBrandMark item={item} />
                  </div>
                </div>

                <div className="mb-6 flex flex-col gap-1">
                  <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {item.degree}
                  </span>
                  <span className="text-sm font-mono text-accent-600 dark:text-accent-400">
                    {item.duration}
                  </span>
                </div>

                <ul className="mt-auto space-y-3">
                  {item.achievements.map((achievement) => (
                    <li
                      className="flex items-start gap-3 text-base leading-relaxed font-light text-slate-600 dark:text-slate-400"
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
