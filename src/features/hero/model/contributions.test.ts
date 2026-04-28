import { describe, expect, it } from 'vitest'

import { parseContributionTotal } from './contributions'

describe('contributions', () => {
  it('parses contribution totals safely', () => {
    expect(parseContributionTotal({ totalContributions: 99 })).toBe(99)
    expect(parseContributionTotal({ totalContributions: '99' })).toBeNull()
    expect(parseContributionTotal({})).toBeNull()
    expect(parseContributionTotal(null)).toBeNull()
    expect(parseContributionTotal('bad')).toBeNull()
  })
})
