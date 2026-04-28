export const DEPLOY_VERSION_POLL_INTERVAL_MS = 60_000

interface DeployVersionManifest {
  version?: unknown
}

export const parseDeployVersion = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const payload = value as DeployVersionManifest

  if (typeof payload.version !== 'string' || payload.version.length === 0) {
    return null
  }

  return payload.version.startsWith('v') ? payload.version : `v${payload.version}`
}
