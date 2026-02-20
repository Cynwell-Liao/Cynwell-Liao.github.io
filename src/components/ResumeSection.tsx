import { motion } from 'framer-motion'
import { FiDownload, FiExternalLink } from 'react-icons/fi'
import { SectionHeading } from './SectionHeading'

interface ResumeSectionProps {
  resumePath: string
}

export function ResumeSection({ resumePath }: ResumeSectionProps) {
  return (
    <section className="section-wrap py-20" id="resume">
      <SectionHeading
        description="A downloadable static PDF is included for direct sharing during applications and interviews."
        eyebrow="Resume"
        title="Download my latest CV"
      />
      <motion.div
        className="glass-panel flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between md:p-8"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.45 }}
        viewport={{ once: true, amount: 0.35 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div>
          <p className="text-base font-medium text-slate-800 dark:text-slate-100">
            Resume file location: <code className="font-mono text-sm">/public/resume.pdf</code>
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Replace the bundled placeholder PDF with your personal resume before publishing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            className="inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700"
            download
            href={resumePath}
          >
            Download PDF
            <FiDownload className="h-4 w-4" />
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent-500 hover:text-accent-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-accent-400 dark:hover:text-accent-300"
            href={resumePath}
            rel="noreferrer"
            target="_blank"
          >
            Open
            <FiExternalLink className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </section>
  )
}
