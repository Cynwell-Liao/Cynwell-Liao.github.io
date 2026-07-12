import { m, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { parseContributionTotal } from '../model/contributions'
import { useCountUpNumber } from '../model/countUp'
import {
  formatLinkedInConnectionCount,
  getLinkedInConnectionCountTarget,
} from '../model/linkedinConnections'

import type { ProfileData } from '../model/profile.types'

interface HeroStatsProps {
  profile: ProfileData
}

type ContributionStatus = 'loading' | 'success' | 'error'

interface ContributionState {
  readonly githubUsername: string
  readonly status: ContributionStatus
  readonly total: number | null
}

const COUNT_UP_DURATION_MS = 1800
const COUNT_UP_START_DELAY_MS = 450
const LINKEDIN_PUBLIC_LIMIT_HOLD_MS = 260
const CONTRIBUTION_REQUEST_TIMEOUT_MS = 8000

const appIconHoverAnimation = { scale: 1.05 }

export function HeroStats({ profile }: HeroStatsProps) {
  const shouldReduceMotion = useReducedMotion()
  const [contributionState, setContributionState] = useState<ContributionState>(() => ({
    githubUsername: profile.githubUsername,
    status: 'loading',
    total: null,
  }))
  const isCurrentRequest = contributionState.githubUsername === profile.githubUsername
  const contributions = isCurrentRequest ? contributionState.total : null
  const contributionStatus = isCurrentRequest ? contributionState.status : 'loading'
  const shouldAnimateCounts = shouldReduceMotion !== true
  const linkedinConnectionTarget = getLinkedInConnectionCountTarget(
    profile.linkedinConnectionCount
  )
  const hasContributionData = contributionStatus === 'success'
  const linkedinConnectionCountUp = useCountUpNumber({
    target: hasContributionData ? linkedinConnectionTarget : null,
    shouldAnimate: shouldAnimateCounts,
    durationMs: COUNT_UP_DURATION_MS,
    startDelayMs: COUNT_UP_START_DELAY_MS,
    finalHoldMs:
      profile.linkedinConnectionCount > linkedinConnectionTarget
        ? LINKEDIN_PUBLIC_LIMIT_HOLD_MS
        : 0,
  })
  const contributionCountUp = useCountUpNumber({
    target: hasContributionData ? contributions : null,
    shouldAnimate: shouldAnimateCounts,
    durationMs: COUNT_UP_DURATION_MS,
    startDelayMs: COUNT_UP_START_DELAY_MS,
  })
  const linkedinConnectionCount = formatLinkedInConnectionCount(
    linkedinConnectionCountUp.value,
    {
      actualConnectionCount: profile.linkedinConnectionCount,
      phase: linkedinConnectionCountUp.phase,
    }
  )

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, CONTRIBUTION_REQUEST_TIMEOUT_MS)

    void fetch(
      `https://github-contributions-api.deno.dev/${profile.githubUsername}.json`,
      {
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Contribution request failed with ${String(response.status)}`)
        }

        return response.json() as Promise<unknown>
      })
      .then((data) => {
        const totalContributions = parseContributionTotal(data)
        if (totalContributions === null) {
          throw new Error('Contribution response did not include a valid total')
        }

        if (isMounted) {
          setContributionState({
            githubUsername: profile.githubUsername,
            status: 'success',
            total: totalContributions,
          })
        }
      })
      .catch(() => {
        if (isMounted) {
          setContributionState({
            githubUsername: profile.githubUsername,
            status: 'error',
            total: null,
          })
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
      })

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [profile.githubUsername])

  return (
    <section
      aria-busy={contributionStatus === 'loading'}
      aria-labelledby="professional-activity-heading"
      className="mt-8 w-full"
    >
      <h2 className="sr-only" id="professional-activity-heading">
        Professional activity
      </h2>
      {contributionStatus === 'loading' ? (
        <p className="sr-only" role="status">
          {profile.contributionsLoadingLabel}
        </p>
      ) : null}
      <div className="flex flex-col items-start gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <m.a
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
                fill="currentColor"
                focusable="false"
                height="32"
                viewBox="0 0 26.182 26.182"
                width="32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.91 0h22.363a1.91 1.91 0 011.909 1.91v22.363a1.91 1.91 0 01-1.91 1.909H1.91A1.91 1.91 0 010 24.272V1.91A1.91 1.91 0 011.91 0zm1.908 22.364h3.818V9.818H3.818zM8.182 5.727a2.455 2.455 0 10-4.91 0 2.455 2.455 0 004.91 0zm2.182 4.091v12.546h3.818v-6.077c0-2.037.75-3.332 2.553-3.332 1.3 0 1.81 1.201 1.81 3.332v6.077h3.819v-6.93c0-3.74-.895-5.78-4.667-5.78-1.967 0-3.277.921-3.788 1.946V9.818z"
                  fillRule="evenodd"
                />
              </svg>
            </m.a>

            <span className="flex flex-wrap items-baseline gap-2 text-base sm:text-lg">
              <span className="text-xl font-bold text-accent-600 sm:text-2xl dark:text-accent-400">
                {linkedinConnectionCount}
              </span>
              <span>{profile.linkedinConnectionsLabel}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <m.a
              aria-label={profile.githubLabel}
              className="social-icon-button social-icon-button--github group"
              href={profile.githubUrl}
              rel="noreferrer"
              target="_blank"
              title={profile.githubLabel}
              whileHover={appIconHoverAnimation}
            >
              <svg
                aria-hidden="true"
                className="octicon octicon-mark-github"
                data-component="Octicon"
                fill="currentColor"
                focusable="false"
                height="34"
                viewBox="0 0 24 24"
                width="34"
              >
                <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943" />
              </svg>
            </m.a>

            <span className="flex flex-wrap items-baseline gap-2 text-base sm:text-lg">
              <span className="text-xl font-bold text-accent-600 sm:text-2xl dark:text-accent-400">
                {contributionCountUp.value.toLocaleString('en-US')}
              </span>
              <span>{profile.contributionsSuffixLabel}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
