import { motion } from 'framer-motion'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <motion.div
      className="mb-10 max-w-3xl"
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true, amount: 0.35 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent-700 dark:text-accent-300">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-50 md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </motion.div>
  )
}
