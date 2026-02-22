import { motion } from 'framer-motion'
import { FiDownload, FiExternalLink } from 'react-icons/fi'

interface ResumeSectionProps {
  resumePath: string
}

export function ResumeSection({ resumePath }: ResumeSectionProps) {
  return (
    <section className="section-wrap py-24 relative" id="resume">
      <motion.div
        className="glass-panel overflow-hidden relative flex flex-col gap-8 p-10 md:flex-row md:items-center md:justify-between mask-image-bento"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 to-secondary-500/10 pointer-events-none" />

        <div className="relative z-10 w-full md:w-2/3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Ready to build something{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-secondary-600 dark:from-accent-400 dark:to-secondary-400">
              resilient?
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed">
            Grab a copy of my resume for a detailed look at my experience in cloud
            infrastructure, AI engineering, and product development.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 md:w-auto">
          <a
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-900 transition-all hover:scale-105 hover:shadow-glow shadow-[0_0_20px_rgba(227,132,178,0.3)]"
            download
            href={resumePath}
          >
            <FiDownload className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
            Download PDF
          </a>
          <a
            className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-white/5 px-8 py-4 text-sm font-bold text-slate-800 dark:text-white backdrop-blur-md transition-all hover:bg-slate-200/50 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/40"
            href={resumePath}
            rel="noreferrer"
            target="_blank"
          >
            <FiExternalLink className="h-5 w-5" />
            Open
          </a>
        </div>
      </motion.div>
    </section>
  )
}
