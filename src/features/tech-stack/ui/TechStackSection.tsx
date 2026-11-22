import { m } from 'framer-motion'
import { createElement } from 'react'

import { getBrandColorStyle } from '@shared/lib/brand'
import { cn } from '@shared/lib/cn'
import { resolveIcon } from '@shared/lib/icons'
import { cardReveal } from '@shared/lib/motion'
import { SECTION_ID } from '@shared/lib/navigation'
import { SectionHeading } from '@shared/ui/SectionHeading'

import type { SkillCategory } from '../model/skill.types'

interface TechStackSectionProps {
  categories: readonly SkillCategory[]
  headingEyebrow: string
  headingTitle: string
  headingDescription: string
}

export function TechStackSection({
  categories,
  headingEyebrow,
  headingTitle,
  headingDescription,
}: TechStackSectionProps) {
  return (
    <section
      aria-labelledby="tech-stack-heading"
      className="section-wrap relative scroll-mt-24 py-24"
      id={SECTION_ID.techStack}
    >
      <div
        aria-hidden="true"
        className="ambient-glow ambient-glow--diffuse absolute top-1/2 right-0 h-96 w-96 text-accent-500/10"
      />

      <SectionHeading
        description={headingDescription}
        eyebrow={headingEyebrow}
        id="tech-stack-heading"
        title={headingTitle}
      />

      <div className="tech-stack-grid relative z-10 mt-12 columns-1 gap-6 md:columns-2 lg:columns-3">
        {categories.map((category, categoryIndex) => (
          <m.article
            {...cardReveal(categoryIndex * 0.1)}
            className="tech-stack-card glass-panel group/card mb-6 w-full break-inside-avoid p-8"
            key={category.title}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-500/5 to-secondary-500/5 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />

            <h3 className="mb-8 border-b border-slate-200 pb-4 text-xl font-bold tracking-tight text-slate-900 dark:border-white/10 dark:text-white">
              {category.title}
            </h3>

            <ul className="space-y-6">
              {category.items.map((item) => {
                const Icon = resolveIcon(item.icon)
                return (
                  <li
                    className="group/item flex items-start gap-4"
                    key={item.name}
                    style={getBrandColorStyle(item.color)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'tech-stack-tile inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-[transform,border-color] duration-300 group-hover/item:scale-110 dark:border-white/80',
                        item.color
                          ? 'tech-stack-icon'
                          : 'text-slate-700 dark:bg-white/5 dark:text-slate-300'
                      )}
                    >
                      {Icon
                        ? createElement(Icon, {
                            'aria-hidden': true,
                            className: 'h-6 w-6',
                          })
                        : null}
                    </span>
                    <div>
                      <span className="tech-stack-title block text-base leading-snug font-semibold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="block text-sm leading-snug font-normal text-slate-600 dark:text-slate-400">
                        {item.note}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </m.article>
        ))}
      </div>
    </section>
  )
}
