import { motion } from 'framer-motion'
import { FiArrowRight, FiGithub, FiTerminal } from 'react-icons/fi'
import type { ProfileData } from '../types/portfolio'

interface HeroSectionProps {
  profile: ProfileData
}

export function HeroSection({ profile }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20 pb-12 lg:pt-0" id="home">

      {/* Background Animated Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-secondary-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="section-wrap relative z-10 grid w-full gap-8 lg:grid-cols-12 lg:gap-10">

        {/* Main Content Area */}
        <motion.div
          className="lg:col-span-7 flex flex-col justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-mono tracking-widest text-accent-300 backdrop-blur-md mb-8 w-fit shadow-[0_0_15px_rgba(227,132,178,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
            </span>
            SYSTEMS ONLINE
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl lg:text-[5.5rem] leading-[1.1]">
            Building <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 via-secondary-500 to-purple-600 dark:from-accent-400 dark:via-secondary-300 dark:to-purple-400">
              {profile.title}s
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 font-light">
            {profile.name} — {profile.tagline}
          </p>

          <div className="mt-10 flex flex-wrap gap-5">
            <a
              className="group relative inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-900 transition-all hover:scale-105 hover:shadow-glow"
              href="#projects"
            >
              Explore Architecture
              <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>

            <a
              className="inline-flex items-center gap-3 rounded-full border border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-white/5 px-8 py-4 text-sm font-semibold text-slate-800 dark:text-white backdrop-blur-md transition-all hover:bg-slate-200/50 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/40"
              href={profile.githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              <FiGithub className="h-5 w-5" />
              GitHub
            </a>
          </div>
        </motion.div>

        {/* Bento Box Right Side */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4 auto-rows-[minmax(0,1fr)]">

          {/* Main Terminal Box */}
          <motion.div
            className="col-span-2 glass-panel p-6 flex flex-col justify-between min-h-[220px]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
              </div>
              <FiTerminal className="text-slate-500 dark:text-slate-400" />
            </div>
            <div className="font-mono text-sm leading-relaxed text-slate-600 dark:text-slate-300 mt-2">
              <span className="text-accent-600 dark:text-accent-400">~/stack</span> $ ls -la<br />
              drwxr-xr-x AI Models<br />
              drwxr-xr-x Cloud Native<br />
              drwxr-xr-x Developer Exp<br />
              <span className="text-accent-600 dark:text-accent-400 mt-2 block">~/stack</span> $ <span className="animate-pulse">_</span>
            </div>
          </motion.div>

          {/* GitHub Contributions Box */}
          <motion.div
            className="col-span-2 glass-panel p-6 flex flex-col justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <FiGithub className="w-4 h-4" />
              GitHub Contributions
            </h3>
            <div className="w-full overflow-hidden flex justify-center bg-slate-100/50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
              {/* Using ghchart to render contribution graph with default GitHub colors */}
              <img
                src={`https://ghchart.rshah.org/${profile.githubUsername}`}
                alt={`${profile.name}'s Github chart`}
                className="w-full max-w-[800px] object-cover dark:invert dark:hue-rotate-[180deg] opacity-90 dark:opacity-80"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
