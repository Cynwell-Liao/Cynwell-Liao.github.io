interface GithubContributionsResponse {
  totalContributions?: unknown
}

export const parseContributionTotal = (value: unknown): number | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const payload = value as GithubContributionsResponse

  return typeof payload.totalContributions === 'number'
    ? payload.totalContributions
    : null
}
