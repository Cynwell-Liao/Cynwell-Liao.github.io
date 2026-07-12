import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

interface AboutSectionProps {
  headingLead: string
  headingAccent: string
  intro: string
  paragraphs: readonly string[]
}

export function AboutSection({
  headingLead,
  headingAccent,
  intro,
  paragraphs,
}: AboutSectionProps) {
  const containerRef = useRef<HTMLElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  return (
    <section
      aria-labelledby="about-heading"
      className="section-wrap relative scroll-mt-24 py-24 lg:py-32"
      id="about"
      ref={containerRef}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-0 h-72 w-72 rounded-full bg-secondary-500/10 mix-blend-screen blur-[120px]"
      />

      <div className="relative z-10 grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="relative lg:col-span-5">
          <m.div
            className="lg:sticky lg:top-24"
            style={{ y: shouldReduceMotion ? 0 : y }}
          >
            <h2
              aria-label={`${headingLead} ${headingAccent}`}
              className="mb-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-5xl"
              id="about-heading"
            >
              {headingLead}
              <br />
              <span className="bg-gradient-to-r from-accent-600 to-secondary-600 bg-clip-text text-transparent dark:from-accent-400 dark:to-secondary-400">
                {headingAccent}
              </span>
            </h2>
            <p className="max-w-md text-lg font-light text-slate-600 dark:text-slate-400">
              {intro}
            </p>
          </m.div>
        </div>

        <div className="lg:col-span-7">
          <div className="glass-panel group p-8 md:p-12">
            <div
              aria-hidden="true"
              className="absolute top-0 right-0 h-64 w-64 rounded-full bg-secondary-500/10 opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-100"
            />

            <div className="relative z-10 space-y-8">
              {paragraphs.map((paragraph, idx) => (
                <m.p
                  className="text-lg leading-relaxed font-light text-slate-700 dark:text-slate-300"
                  initial={{ opacity: 0, x: 20 }}
                  key={`${String(idx)}-${paragraph}`}
                  transition={{ duration: 0.6, delay: idx * 0.2 }}
                  viewport={{ once: true, amount: 0.35 }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  {paragraph}
                </m.p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
