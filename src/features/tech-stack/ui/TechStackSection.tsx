import { m } from 'framer-motion'
import { createElement } from 'react'

import { cn } from '@shared/lib/cn'
import { resolveIcon } from '@shared/lib/icons'
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
      id="tech-stack"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 h-96 w-96 rounded-full bg-accent-500/10 mix-blend-screen blur-[150px]"
      />

      <SectionHeading
        description={headingDescription}
        eyebrow={headingEyebrow}
        id="tech-stack-heading"
        title={headingTitle}
      />

      <div className="relative z-10 mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, categoryIndex) => (
          <m.article
            className="glass-panel group/card p-8"
            initial={{ opacity: 0, y: 30 }}
            key={category.title}
            transition={{
              duration: 0.6,
              delay: categoryIndex * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
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
                  <li className="group/item flex items-start gap-4" key={item.name}>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-[transform,border-color] duration-300 group-hover/item:scale-110 group-hover/item:border-accent-400/50 dark:border-white/10 dark:group-hover/item:border-accent-500/30',
                        item.color
                          ? 'dark:bg-white/90'
                          : 'text-slate-700 dark:bg-white/5 dark:text-slate-300'
                      )}
                      style={item.color ? { color: item.color } : {}}
                    >
                      {Icon
                        ? createElement(Icon, {
                            'aria-hidden': true,
                            className: 'h-6 w-6',
                          })
                        : null}
                    </span>
                    <div>
                      <span className="block text-base font-semibold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-sm leading-snug font-light text-slate-500 dark:text-slate-400">
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
