import { z } from 'zod'

const contributionsResponseSchema = z.object({
  total: z.object({
    lastYear: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  }),
})

const CONTRIBUTIONS_API_BASE_URL = 'https://github-contributions-api.jogruber.de/v4'

interface FetchContributionTotalOptions {
  readonly githubUsername: string
  readonly signal: AbortSignal
}

export const createContributionsApiUrl = (githubUsername: string): string =>
  `${CONTRIBUTIONS_API_BASE_URL}/${encodeURIComponent(githubUsername)}?y=last`

export const parseContributionTotal = (value: unknown): number | null => {
  const result = contributionsResponseSchema.safeParse(value)

  return result.success ? result.data.total.lastYear : null
}

export const fetchContributionTotal = async ({
  githubUsername,
  signal,
}: FetchContributionTotalOptions): Promise<number> => {
  const response = await fetch(createContributionsApiUrl(githubUsername), {
    referrerPolicy: 'no-referrer',
    signal,
  })

  if (!response.ok) {
    throw new Error(`Contribution request failed with ${String(response.status)}`)
  }

  const totalContributions = parseContributionTotal(await response.json())
  if (totalContributions === null) {
    throw new Error('Contribution response did not include a valid total')
  }

  return totalContributions
}
