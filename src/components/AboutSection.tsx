import { motion } from 'framer-motion'
import { SectionHeading } from './SectionHeading'

interface AboutSectionProps {
  paragraphs: string[]
}

export function AboutSection({ paragraphs }: AboutSectionProps) {
  return (
    <section className="section-wrap py-20" id="about">
      <SectionHeading
        description="I work at the intersection of AI reliability and cloud infrastructure, turning complex systems into practical product outcomes."
        eyebrow="About"
        title="Engineering mindset, product velocity"
      />
      <div className="glass-panel p-7 md:p-10">
        <div className="grid gap-6 md:grid-cols-2">
          {paragraphs.map((paragraph) => (
            <motion.p
              className="text-base leading-relaxed text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, y: 18 }}
              key={paragraph}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, amount: 0.35 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  )
}
