import { describe, expect, it } from 'vitest'

import {
  hexColorSchema,
  httpsUrlSchema,
  iconKeySchema,
  navigationFragmentSchema,
  nonBlankTextSchema,
  positiveDimensionSchema,
} from './primitives'

describe('content schema primitives', () => {
  it('trims non-blank text and rejects whitespace-only text', () => {
    expect(nonBlankTextSchema.parse('  value  ')).toBe('value')
    expect(() => nonBlankTextSchema.parse('   ')).toThrow()
  })

  it('accepts only valid HTTPS URLs', () => {
    expect(httpsUrlSchema.parse('  https://example.com/path  ')).toBe(
      'https://example.com/path'
    )
    expect(() => httpsUrlSchema.parse('http://example.com')).toThrow()
    expect(() => httpsUrlSchema.parse('not a URL')).toThrow()
  })

  it('accepts only six-digit hexadecimal colors', () => {
    expect(hexColorSchema.parse('#a1B2c3')).toBe('#a1B2c3')
    expect(() => hexColorSchema.parse('#FFF')).toThrow()
    expect(() => hexColorSchema.parse('rgb(0, 0, 0)')).toThrow()
  })

  it('accepts only positive whole-number dimensions', () => {
    expect(positiveDimensionSchema.parse(120)).toBe(120)
    expect(() => positiveDimensionSchema.parse(0)).toThrow()
    expect(() => positiveDimensionSchema.parse(1.5)).toThrow()
  })

  it('accepts only canonical navigation fragments', () => {
    expect(navigationFragmentSchema.parse('#tech-stack')).toBe('#tech-stack')
    expect(() => navigationFragmentSchema.parse('#unknown')).toThrow()
    expect(() => navigationFragmentSchema.parse('projects')).toThrow()
  })

  it('accepts only registered icon keys', () => {
    expect(iconKeySchema.parse('typescript')).toBe('typescript')
    expect(() => iconKeySchema.parse('unknown-icon')).toThrow()
    expect(() => iconKeySchema.parse(42)).toThrow()
  })
})
