interface GithubContributionsResponse {
  totalContributions?: unknown
}

export const parseContributionTotal = (value: unknown): number | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const payload = value as GithubContributionsResponse

  return typeof payload.totalContributions === 'number' &&
    Number.isSafeInteger(payload.totalContributions) &&
    payload.totalContributions >= 0
    ? payload.totalContributions
    : null
}
