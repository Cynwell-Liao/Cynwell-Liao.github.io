import { describe, expect, it } from 'vitest'

import { createContributionsApiUrl, parseContributionTotal } from './contributions'

describe('contributions', () => {
  it('builds an encoded last-year contribution URL', () => {
    expect(createContributionsApiUrl('ada/lovelace')).toBe(
      'https://github-contributions-api.jogruber.de/v4/ada%2Flovelace?y=last'
    )
  })

  it('parses a valid last-year contribution total', () => {
    expect(
      parseContributionTotal({
        total: { lastYear: 99 },
        contributions: [{ count: 1, date: '2026-01-01', level: 1 }],
      })
    ).toBe(99)
    expect(parseContributionTotal({ total: { lastYear: 0 } })).toBe(0)
  })

  it.each([
    ['a string total', { total: { lastYear: '99' } }],
    ['a missing total', {}],
    ['a missing last-year value', { total: {} }],
    ['a null payload', null],
    ['a text payload', 'bad'],
    ['a negative total', { total: { lastYear: -1 } }],
    ['a fractional total', { total: { lastYear: 1.5 } }],
    ['a NaN total', { total: { lastYear: Number.NaN } }],
    ['an infinite total', { total: { lastYear: Number.POSITIVE_INFINITY } }],
    ['an unsafe integer total', { total: { lastYear: Number.MAX_SAFE_INTEGER + 1 } }],
  ])('rejects %s', (_description, payload) => {
    expect(parseContributionTotal(payload)).toBeNull()
  })
})
