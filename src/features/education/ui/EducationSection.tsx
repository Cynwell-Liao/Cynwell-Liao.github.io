import { m } from 'framer-motion'

import { getMotionBrandColorStyle } from '@shared/lib/brand'
import { cn } from '@shared/lib/cn'
import { cardReveal } from '@shared/lib/motion'
import { SECTION_ID } from '@shared/lib/navigation'
import { usePointerHover } from '@shared/lib/pointer/usePointerHover'
import { BrandLogo } from '@shared/ui/BrandLogo'
import { SectionHeading } from '@shared/ui/SectionHeading'

import type { EducationItem } from '../model/education.types'

interface EducationSectionProps {
  education: readonly EducationItem[]
  headingEyebrow: string
  headingTitle: string
  headingDescription: string
}

function EducationCard({ item, index }: { item: EducationItem; index: number }) {
  const { pointerHovered, pointerHoverHandlers } = usePointerHover()
  const isHero = index === 0

  return (
    <m.article
      {...cardReveal(index * 0.15)}
      {...(item.color ? { style: getMotionBrandColorStyle(item.color) } : {})}
      className={cn(
        'glass-panel flex flex-col p-8',
        isHero ? 'md:col-span-2' : 'md:col-span-1'
      )}
      {...pointerHoverHandlers}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500',
          pointerHovered && 'opacity-10'
        )}
        style={
          item.color
            ? {
                background:
                  'radial-gradient(circle at top right, var(--brand-color), transparent 70%)',
              }
            : undefined
        }
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3">
            <BrandLogo active={pointerHovered} url={item.logoUrl} />
            <h3 className="brand-title text-xl font-bold tracking-tight text-slate-900 transition-colors dark:text-white">
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
                style={{
                  backgroundColor: 'var(--brand-color, #e384b2)',
                  boxShadow: '0 0 8px var(--brand-color, #e384b2)',
                }}
              />
              <span>{achievement}</span>
            </li>
          ))}
        </ul>
      </div>
    </m.article>
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
        {education.map((item, index) => (
          <EducationCard index={index} item={item} key={item.institution} />
        ))}
      </div>
    </section>
  )
}
