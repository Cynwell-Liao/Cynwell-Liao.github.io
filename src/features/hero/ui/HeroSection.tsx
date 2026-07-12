import { m } from 'framer-motion'

import { CertificationMarquee } from './CertificationMarquee'
import { ContributionChart } from './ContributionChart'
import { HeroStats } from './HeroStats'

import type { ProfileData } from '../model/profile.types'

interface HeroSectionProps {
  deployVersion: string
  profile: ProfileData
}

export function HeroSection({ deployVersion, profile }: HeroSectionProps) {
  return (
    <section
      aria-labelledby="home-heading"
      className="relative flex min-h-dvh scroll-mt-24 items-center justify-center overflow-hidden pt-32 pb-12 sm:pt-32 lg:pt-36"
      id="home"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-blob rounded-full bg-accent-500/15 mix-blend-screen blur-[100px]" />
        <div className="hero-orb-delay-2000 absolute top-1/3 right-1/4 h-96 w-96 animate-blob rounded-full bg-purple-500/15 mix-blend-screen blur-[100px]" />
        <div className="hero-orb-delay-4000 absolute bottom-1/4 left-1/2 h-96 w-96 animate-blob rounded-full bg-secondary-500/15 mix-blend-screen blur-[100px]" />
      </div>

      <div className="section-wrap relative z-10 flex w-full flex-col gap-8">
        <m.div
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full min-w-0 flex-col justify-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-8 inline-flex w-fit items-center gap-3 rounded-full border border-slate-300 bg-slate-100/50 px-4 py-1.5 font-mono text-xs tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-md dark:border-white/20 dark:bg-white/5">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-semibold tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
                {profile.heroStatusLabel}
              </span>
              <span className="text-[0.68rem] font-medium tracking-[0.28em] text-slate-500 dark:text-slate-400">
                {deployVersion}
              </span>
            </span>
          </div>

          <h1
            className="text-5xl leading-[1.1] font-bold tracking-tight break-words text-slate-900 sm:text-6xl md:text-7xl lg:text-[5.5rem] dark:text-white"
            id="home-heading"
          >
            <span className="bg-gradient-to-r from-accent-600 via-secondary-500 to-purple-600 bg-clip-text text-transparent dark:from-accent-400 dark:via-secondary-300 dark:to-purple-400">
              {profile.title}
            </span>
          </h1>

          <HeroStats profile={profile} />
          <ContributionChart
            githubLabel={profile.githubLabel}
            githubUrl={profile.githubUrl}
            githubUsername={profile.githubUsername}
            name={profile.name}
          />
          <CertificationMarquee
            certifications={profile.heroCertifications}
            heading={profile.heroCertificationsHeading}
          />
        </m.div>
      </div>
    </section>
  )
}
