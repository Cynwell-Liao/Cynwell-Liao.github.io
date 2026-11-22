import type { MotionStyle } from 'framer-motion'
import type { CSSProperties } from 'react'

interface BrandColorProperties extends CSSProperties {
  '--brand-color': string
}

type MotionBrandColorProperties = MotionStyle & BrandColorProperties

export function getBrandColorStyle(color: string): BrandColorProperties
export function getBrandColorStyle(color: undefined): undefined
export function getBrandColorStyle(
  color: string | undefined
): BrandColorProperties | undefined
export function getBrandColorStyle(
  color: string | undefined
): BrandColorProperties | undefined {
  return color
    ? {
        '--brand-color': color,
      }
    : undefined
}

export const getMotionBrandColorStyle = (
  color: string
): MotionBrandColorProperties => ({ '--brand-color': color })
