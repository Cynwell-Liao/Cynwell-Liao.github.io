import type { CSSProperties } from 'react'

interface BrandColorProperties extends CSSProperties {
  '--brand-color': string
}

export const getBrandColorStyle = (
  color: string | undefined
): BrandColorProperties | undefined =>
  color
    ? {
        '--brand-color': color,
      }
    : undefined
