import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { parseContributionTotal } from '../model/contributions'
import { formatLinkedInConnectionCount } from '../model/linkedinConnections'

import type { ProfileData } from '../model/profile.types'

interface HeroSectionProps {
  deployVersion: string
  profile: ProfileData
}

const appIconHoverAnimation = {
  scale: 1.05,
}

export function HeroSection({ deployVersion, profile }: HeroSectionProps) {
  const [contributions, setContributions] = useState<number | null>(null)
  const certificationMarqueeItems = [
    ...profile.heroCertifications,
    ...profile.heroCertifications,
  ]
  const linkedinConnectionCount = formatLinkedInConnectionCount(
    profile.linkedinConnectionCount
  )

  useEffect(() => {
    fetch(`https://github-contributions-api.deno.dev/${profile.githubUsername}.json`)
      .then((res) => res.json())
      .then((data: unknown) => {
        const totalContributions = parseContributionTotal(data)

        if (totalContributions !== null) {
          setContributions(totalContributions)
        }
      })
      .catch(console.error)
  }, [profile.githubUsername])

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-32 pb-12 sm:pt-32 lg:pt-36"
      id="home"
    >
      {/* Background Animated Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-secondary-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="section-wrap relative z-10 flex w-full flex-col gap-8">
        {/* Main Content Area */}
        <motion.div
          className="flex w-full min-w-0 flex-col justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-white/5 px-4 py-1.5 text-xs font-mono tracking-widest backdrop-blur-md mb-8 w-fit shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
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

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white md:text-7xl lg:text-[5.5rem] leading-[1.1] break-words">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 via-secondary-500 to-purple-600 dark:from-accent-400 dark:via-secondary-300 dark:to-purple-400">
              {profile.title}
            </span>
          </h1>

          <motion.div
            className="mt-8 w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2
              id="js-contribution-activity-description"
              className="mb-3 flex flex-col items-start gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200"
              tabIndex={-1}
            >
              <span className="flex flex-col items-start gap-3">
                <span className="flex flex-wrap items-center gap-3">
                  <motion.a
                    aria-label={profile.linkedinLabel}
                    className="social-icon-button social-icon-button--linkedin group"
                    href={profile.linkedinUrl}
                    rel="noreferrer"
                    target="_blank"
                    title={profile.linkedinLabel}
                    whileHover={appIconHoverAnimation}
                  >
                    <svg
                      aria-hidden="true"
                      className="linkedin-bug"
                      display="inline-block"
                      fill="currentColor"
                      focusable="false"
                      height="32"
                      overflow="visible"
                      style={{ verticalAlign: 'text-bottom' }}
                      viewBox="0 0 26.182 26.182"
                      width="32"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.91 0h22.363a1.91 1.91 0 011.909 1.91v22.363a1.91 1.91 0 01-1.91 1.909H1.91A1.91 1.91 0 010 24.272V1.91A1.91 1.91 0 011.91 0zm1.908 22.364h3.818V9.818H3.818zM8.182 5.727a2.455 2.455 0 10-4.91 0 2.455 2.455 0 004.91 0zm2.182 4.091v12.546h3.818v-6.077c0-2.037.75-3.332 2.553-3.332 1.3 0 1.81 1.201 1.81 3.332v6.077h3.819v-6.93c0-3.74-.895-5.78-4.667-5.78-1.967 0-3.277.921-3.788 1.946V9.818z"
                        fill="currentColor"
                        fillRule="evenodd"
                      />
                    </svg>
                  </motion.a>

                  <span className="flex flex-wrap items-baseline gap-2 text-base sm:text-lg">
                    <span className="font-bold text-xl text-accent-600 sm:text-2xl dark:text-accent-400">
                      {linkedinConnectionCount}
                    </span>
                    <span>{profile.linkedinConnectionsLabel}</span>
                  </span>
                </span>

                <span className="flex flex-wrap items-center gap-3">
                  <motion.a
                    aria-label={profile.githubLabel}
                    className="social-icon-button social-icon-button--github group"
                    href={profile.githubUrl}
                    rel="noreferrer"
                    target="_blank"
                    title={profile.githubLabel}
                    whileHover={appIconHoverAnimation}
                  >
                    <svg
                      data-component="Octicon"
                      aria-hidden="true"
                      className="octicon octicon-mark-github"
                      display="inline-block"
                      fill="currentColor"
                      focusable="false"
                      height="34"
                      overflow="visible"
                      style={{ verticalAlign: 'text-bottom' }}
                      viewBox="0 0 24 24"
                      width="34"
                    >
                      <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943" />
                    </svg>
                  </motion.a>

                  <span className="flex flex-wrap items-baseline gap-2 text-base sm:text-lg">
                    {contributions !== null ? (
                      <>
                        <span className="font-bold text-xl text-accent-600 sm:text-2xl dark:text-accent-400">
                          {contributions}
                        </span>
                        <span>{profile.contributionsSuffixLabel}</span>
                      </>
                    ) : (
                      profile.contributionsLoadingLabel
                    )}
                  </span>
                </span>
              </span>
            </h2>

            {/* GitHub Contributions Box */}
            <div
              aria-labelledby="js-contribution-activity-description"
              className="glass-panel group relative flex w-full min-w-0 overflow-hidden p-3 sm:p-4"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-500/10 rounded-full blur-[80px] transition-opacity duration-500 opacity-0 group-hover:opacity-100" />

              {/* Using ghchart to render contribution graph with default GitHub colors */}
              <div className="relative z-10 w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                <img
                  alt={`${profile.name}'s Github chart`}
                  className="block h-auto min-w-[600px] w-full max-w-none object-contain opacity-90 dark:invert dark:hue-rotate-[180deg] dark:opacity-80"
                  src={`https://ghchart.rshah.org/${profile.githubUsername}`}
                />
              </div>
            </div>
          </motion.div>

          <div className="mt-8 max-w-2xl">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {profile.heroCertificationsHeading}
              </p>
            </div>

            <div
              aria-label={profile.heroCertificationsHeading}
              className="hero-cert-marquee"
              role="region"
            >
              <div className="hero-cert-marquee__viewport">
                <div className="hero-cert-marquee__track">
                  {certificationMarqueeItems.map((certification, index) => (
                    <a
                      className="hero-cert-marquee__badge-link"
                      href={certification.credentialUrl}
                      key={`${certification.credentialUrl}-${String(index)}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <img
                        alt={certification.imageAlt}
                        className="hero-cert-marquee__badge-image"
                        height={certification.imageHeight ?? 105}
                        src={certification.imageUrl}
                        width={certification.imageWidth ?? 105}
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
