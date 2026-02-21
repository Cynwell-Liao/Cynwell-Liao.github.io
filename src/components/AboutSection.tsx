import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

interface AboutSectionProps {
  paragraphs: string[]
}

export function AboutSection({ paragraphs }: AboutSectionProps) {
  const containerRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  return (
    <section className="section-wrap py-24 lg:py-32 relative" id="about" ref={containerRef}>
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-accent-500/10 rounded-full mix-blend-screen filter blur-[120px]" />

      <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        <div className="lg:col-span-5 relative">
          <motion.div
            style={{ y }}
            className="sticky top-24"
          >
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
              Engineering mindset,<br />
              <span className="text-accent-400">product velocity.</span>
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-md">
              I work at the intersection of AI reliability and cloud infrastructure, turning complex systems into practical product outcomes.
            </p>
          </motion.div>
        </div>

        <div className="lg:col-span-7">
          <div className="glass-panel p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px] transition-opacity duration-500 opacity-0 group-hover:opacity-100" />

            <div className="space-y-8 relative z-10">
              {paragraphs.map((paragraph, idx) => (
                <motion.p
                  className="text-lg leading-relaxed text-slate-300 font-light"
                  initial={{ opacity: 0, x: 20 }}
                  key={paragraph}
                  transition={{ duration: 0.6, delay: idx * 0.2 }}
                  viewport={{ once: true, amount: 0.35 }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
