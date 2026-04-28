export const DEPLOY_VERSION_POLL_INTERVAL_MS = 60_000

interface ReleaseMetadata {
  tag_name?: unknown
}

export const parseDeployVersion = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const payload = value as ReleaseMetadata

  if (typeof payload.tag_name !== 'string' || payload.tag_name.length === 0) {
    return null
  }

  return payload.tag_name.startsWith('v') ? payload.tag_name : `v${payload.tag_name}`
}
