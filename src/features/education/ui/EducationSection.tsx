import { motion } from 'framer-motion'

import { SectionHeading } from '@shared/ui/SectionHeading'

import type { EducationItem } from '../model/education.types'

interface EducationSectionProps {
  education: EducationItem[]
  headingEyebrow: string
  headingTitle: string
  headingDescription: string
}

export function EducationSection({
  education,
  headingEyebrow,
  headingTitle,
  headingDescription,
}: EducationSectionProps) {
  return (
    <section className="section-wrap py-24 relative z-10" id="education">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-accent-500/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />

      <SectionHeading
        description={headingDescription}
        eyebrow={headingEyebrow}
        title={headingTitle}
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:gap-8 relative z-10">
        {education.map((item, index) => {
          const Icon = item.icon
          // The first item (Master's) spans two columns on medium screens and up
          const isHero = index === 0

          return (
            <motion.article
              className={`glass-panel p-8 md:p-10 group relative overflow-hidden flex flex-col ${
                isHero ? 'md:col-span-2' : 'md:col-span-1'
              }`}
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
              {/* Dynamic Hover Gradient based on brand color */}
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10 pointer-events-none rounded-3xl"
                style={
                  item.color
                    ? {
                        background: `radial-gradient(circle at top right, ${item.color}, transparent 70%)`,
                      }
                    : {}
                }
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors group-hover:text-accent-600 dark:group-hover:text-accent-300">
                      {item.institution}
                    </h3>
                    {item.location && (
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize tracking-wide">
                        {item.location}
                      </span>
                    )}
                  </div>

                  {(item.logoUrl || Icon) && (
                    <div className="flex-shrink-0 mt-1 sm:mt-0">
                      <span
                        className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 overflow-hidden ${
                          item.logoUrl ? 'p-0' : 'p-1.5'
                        }`}
                        style={
                          item.color && !item.logoUrl
                            ? { color: item.color, borderColor: `${item.color}40` }
                            : {}
                        }
                      >
                        {item.logoUrl ? (
                          <img
                            src={item.logoUrl}
                            alt={item.institution}
                            className="h-full w-full object-cover scale-110 mix-blend-multiply dark:mix-blend-normal"
                          />
                        ) : Icon ? (
                          <Icon className="h-7 w-7" />
                        ) : null}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-6 flex flex-col gap-1">
                  <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {item.degree}
                  </span>
                  <span className="text-sm font-mono text-accent-600 dark:text-accent-400">
                    {item.duration}
                  </span>
                </div>

                <ul className="space-y-3 mt-auto">
                  {item.achievements.map((achievement, i) => (
                    <li
                      className="flex items-start gap-3 text-base text-slate-600 dark:text-slate-400 font-light leading-relaxed"
                      key={i}
                    >
                      <span
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
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
