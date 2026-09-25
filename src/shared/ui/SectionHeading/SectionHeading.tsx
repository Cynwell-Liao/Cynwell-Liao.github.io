import { m } from 'framer-motion'

interface SectionHeadingProps {
  id: string
  eyebrow: string
  title: string
  titleAccent?: string
  description: string
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  titleAccent,
  description,
}: SectionHeadingProps) {
  return (
    <m.div
      className="mb-10 max-w-3xl"
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true, amount: 0.35 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent-700 dark:text-accent-300">
        {eyebrow}
      </p>
      <h2 className="section-title text-slate-900 dark:text-slate-50" id={id}>
        {title}
        {titleAccent ? (
          <>
            {' '}
            <span className="bg-gradient-to-r from-accent-600 to-secondary-700 bg-clip-text text-transparent dark:from-accent-400 dark:to-secondary-400">
              {titleAccent}
            </span>
          </>
        ) : null}
      </h2>
      <p className="body-copy mt-4 text-slate-600 dark:text-slate-300">{description}</p>
    </m.div>
  )
}
