import { motion } from 'framer-motion'
import type { SkillCategory } from '../types/portfolio'
import { SectionHeading } from './SectionHeading'

interface TechStackSectionProps {
  categories: SkillCategory[]
}

export function TechStackSection({ categories }: TechStackSectionProps) {
  return (
    <section className="section-wrap py-24 relative" id="tech-stack">
      {/* Background ambient light */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent-500/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />

      <SectionHeading
        description="Tools and platforms I rely on to build robust AI and cloud systems."
        eyebrow="Tech Stack"
        title="Production-ready toolkit"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12 relative z-10">
        {categories.map((category, categoryIndex) => (
          <motion.div
            className="glass-panel p-8 group relative"
            initial={{ opacity: 0, y: 30 }}
            key={category.title}
            transition={{ duration: 0.6, delay: categoryIndex * 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-secondary-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-3xl pointer-events-none" />

            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-white/10 pb-4">
              {category.title}
            </h3>

            <ul className="space-y-6">
              {category.items.map((item, itemIndex) => {
                const Icon = item.icon
                return (
                  <motion.li
                    className="flex items-start gap-4"
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: (categoryIndex * 0.1) + (itemIndex * 0.1) }}
                    viewport={{ once: true }}
                  >
                    <span
                      className={`flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-transform duration-300 group-hover:scale-110 group-hover:border-accent-400/50 dark:group-hover:border-accent-500/30 ${!item.color ? 'text-slate-700 dark:text-slate-300' : ''
                        }`}
                      style={item.color ? { color: item.color } : {}}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <span className="block text-base font-semibold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="block text-sm text-slate-500 dark:text-slate-400 font-light mt-1 leading-snug">
                        {item.note}
                      </span>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
