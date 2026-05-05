import { describe, expect, it } from 'vitest'

import {
  formatLinkedInConnectionCount,
  getLinkedInConnectionCountTarget,
} from './linkedinConnections'

describe('linkedinConnections', () => {
  it('uses the public connection limit as the animation target', () => {
    expect(getLinkedInConnectionCountTarget(499)).toBe(499)
    expect(getLinkedInConnectionCountTarget(500)).toBe(500)
    expect(getLinkedInConnectionCountTarget(1200)).toBe(500)
  })

  it('renders exact counts below the public connection limit', () => {
    expect(formatLinkedInConnectionCount(0)).toBe('0')
    expect(formatLinkedInConnectionCount(499)).toBe('499')
  })

  it('caps public counts at 500+', () => {
    expect(formatLinkedInConnectionCount(500)).toBe('500+')
    expect(formatLinkedInConnectionCount(501)).toBe('500+')
    expect(formatLinkedInConnectionCount(1200)).toBe('500+')
  })

  it('shows the final numeric limit before switching to 500+', () => {
    expect(
      formatLinkedInConnectionCount(499, {
        actualConnectionCount: 1200,
        phase: 'counting',
      })
    ).toBe('499')
    expect(
      formatLinkedInConnectionCount(500, {
        actualConnectionCount: 1200,
        phase: 'holding',
      })
    ).toBe('500')
    expect(
      formatLinkedInConnectionCount(500, {
        actualConnectionCount: 1200,
        phase: 'complete',
      })
    ).toBe('500+')
  })
})
