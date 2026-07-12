import { useState } from 'react'

interface ContributionChartProps {
  githubLabel: string
  githubUrl: string
  githubUsername: string
  name: string
}

export function ContributionChart({
  githubLabel,
  githubUrl,
  githubUsername,
  name,
}: ContributionChartProps) {
  const [failedUsername, setFailedUsername] = useState<string | null>(null)
  const hasImageError = failedUsername === githubUsername

  return (
    <figure
      aria-labelledby="github-contribution-chart-caption"
      className="glass-panel group relative mt-3 flex w-full min-w-0 p-3 sm:p-4"
    >
      <figcaption className="sr-only" id="github-contribution-chart-caption">
        {name}&apos;s GitHub contribution activity
      </figcaption>
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 h-64 w-64 rounded-full bg-secondary-500/10 opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-100"
      />
      {hasImageError ? (
        <div className="relative z-10 flex min-h-24 w-full items-center justify-center text-sm text-slate-600 dark:text-slate-300">
          <a
            className="rounded-sm font-medium text-accent-700 underline decoration-accent-400 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-accent-300"
            href={githubUrl}
            rel="noreferrer"
            target="_blank"
          >
            View {githubLabel} activity
          </a>
        </div>
      ) : (
        <a
          aria-label={`View ${name}'s GitHub contribution chart`}
          className="relative z-10 w-full overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          href={githubUrl}
          rel="noreferrer"
          target="_blank"
        >
          <img
            alt={`${name}'s GitHub contribution chart`}
            className="block h-auto min-w-[663px] w-full max-w-none object-contain opacity-90 dark:invert dark:hue-rotate-[180deg] dark:opacity-80"
            decoding="async"
            fetchPriority="high"
            height={104}
            onError={() => {
              setFailedUsername(githubUsername)
            }}
            referrerPolicy="no-referrer"
            src={`https://ghchart.rshah.org/${githubUsername}`}
            width={663}
          />
        </a>
      )}
    </figure>
  )
}
