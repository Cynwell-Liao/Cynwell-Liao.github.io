import { motion } from 'framer-motion'
import type { SkillCategory } from '../types/portfolio'
import { SectionHeading } from './SectionHeading'

interface TechStackSectionProps {
  categories: SkillCategory[]
}

export function TechStackSection({ categories }: TechStackSectionProps) {
  return (
    <section className="section-wrap py-20" id="tech-stack">
      <SectionHeading
        description="Tools and platforms I rely on to build robust AI and cloud systems."
        eyebrow="Tech Stack"
        title="Production-ready toolkit"
      />
      <div className="grid gap-6 md:grid-cols-3">
        {categories.map((category, categoryIndex) => (
          <motion.div
            className="glass-panel p-6"
            initial={{ opacity: 0, y: 20 }}
            key={category.title}
            transition={{ duration: 0.45, delay: categoryIndex * 0.06 }}
            viewport={{ once: true, amount: 0.3 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {category.title}
            </h3>
            <ul className="mt-5 space-y-4">
              {category.items.map((item) => {
                const Icon = item.icon
                return (
                  <li className="flex items-center gap-3" key={item.name}>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-accent-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-accent-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="block text-xs text-slate-600 dark:text-slate-300">
                        {item.note}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
