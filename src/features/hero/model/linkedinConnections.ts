const LINKEDIN_PUBLIC_CONNECTION_LIMIT = 500

export const formatLinkedInConnectionCount = (connectionCount: number): string =>
  connectionCount >= LINKEDIN_PUBLIC_CONNECTION_LIMIT
    ? `${String(LINKEDIN_PUBLIC_CONNECTION_LIMIT)}+`
    : String(connectionCount)
