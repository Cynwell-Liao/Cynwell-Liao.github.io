import type { CountUpPhase } from './countUp'

const LINKEDIN_PUBLIC_CONNECTION_LIMIT = 500

interface FormatLinkedInConnectionCountOptions {
  actualConnectionCount?: number
  phase?: CountUpPhase
}

export const getLinkedInConnectionCountTarget = (connectionCount: number): number =>
  Math.min(LINKEDIN_PUBLIC_CONNECTION_LIMIT, Math.max(0, Math.floor(connectionCount)))

export const formatLinkedInConnectionCount = (
  connectionCount: number,
  options: FormatLinkedInConnectionCountOptions = {}
): string => {
  const displayCount = getLinkedInConnectionCountTarget(connectionCount)
  const actualConnectionCount = options.actualConnectionCount ?? connectionCount
  const phase = options.phase ?? 'complete'
  const shouldUsePublicLimit =
    actualConnectionCount >= LINKEDIN_PUBLIC_CONNECTION_LIMIT &&
    displayCount >= LINKEDIN_PUBLIC_CONNECTION_LIMIT

  return shouldUsePublicLimit && phase === 'complete'
    ? `${String(LINKEDIN_PUBLIC_CONNECTION_LIMIT)}+`
    : String(displayCount)
}
