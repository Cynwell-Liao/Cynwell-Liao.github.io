import { m } from 'framer-motion'

import { SECTION_ID } from '@shared/lib/navigation'
import { SectionHeading } from '@shared/ui/SectionHeading'

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
  return (
    <section
      aria-labelledby="about-heading"
      className="section-wrap relative scroll-mt-24 py-24"
      id={SECTION_ID.about}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-0 h-72 w-72 rounded-full bg-secondary-500/10 mix-blend-screen blur-[120px]"
      />

      <div className="relative z-10">
        <SectionHeading
          description={intro}
          eyebrow="About"
          id="about-heading"
          title={headingLead}
          titleAccent={headingAccent}
        />

        <div className="mt-12">
          <div className="glass-panel group p-8">
            <div
              aria-hidden="true"
              className="absolute top-0 right-0 h-64 w-64 rounded-full bg-secondary-500/10 opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-100"
            />

            <div className="relative z-10 space-y-8">
              {paragraphs.map((paragraph, idx) => (
                <m.p
                  className="body-copy text-slate-700 dark:text-slate-300"
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
