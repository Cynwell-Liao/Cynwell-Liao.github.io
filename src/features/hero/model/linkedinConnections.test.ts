import { describe, expect, it } from 'vitest'

import { formatLinkedInConnectionCount } from './linkedinConnections'

describe('linkedinConnections', () => {
  it('renders exact counts below the public connection limit', () => {
    expect(formatLinkedInConnectionCount(0)).toBe('0')
    expect(formatLinkedInConnectionCount(499)).toBe('499')
  })

  it('caps public counts at 500+', () => {
    expect(formatLinkedInConnectionCount(500)).toBe('500+')
    expect(formatLinkedInConnectionCount(501)).toBe('500+')
    expect(formatLinkedInConnectionCount(1200)).toBe('500+')
  })
})
