import { z } from 'zod'

import { isIconKey } from '@shared/lib/icons/iconKeys'
import type { IconKey } from '@shared/lib/icons/iconKeys'
import { isSectionFragment } from '@shared/lib/navigation'
import type { SectionFragment } from '@shared/lib/navigation'

export const nonBlankTextSchema = z
  .string()
  .trim()
  .min(1, 'Must contain non-whitespace text')

export const httpsUrlSchema = nonBlankTextSchema
  .pipe(z.url())
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'Must use the HTTPS protocol',
  })

export const hexColorSchema = nonBlankTextSchema.regex(
  /^#[0-9a-f]{6}$/iu,
  'Must be a six-digit hexadecimal color'
)

export const positiveDimensionSchema = z
  .number()
  .int('Must be a whole number')
  .positive('Must be positive')

export const navigationFragmentSchema = z.custom<SectionFragment>(
  isSectionFragment,
  'Must reference a known portfolio section'
)

export const iconKeySchema = z.custom<IconKey>(
  isIconKey,
  'Must reference a registered icon'
)
