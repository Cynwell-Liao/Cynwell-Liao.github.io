import { z } from 'zod'

import {
  hexColorSchema,
  httpsUrlSchema,
  iconKeySchema,
  nonBlankTextSchema,
} from './primitives'

export const educationItemSchema = z
  .object({
    institution: nonBlankTextSchema,
    location: nonBlankTextSchema.optional(),
    degree: nonBlankTextSchema,
    duration: nonBlankTextSchema,
    achievements: z.array(nonBlankTextSchema).min(1),
    icon: iconKeySchema.optional(),
    logoUrl: httpsUrlSchema.optional(),
    color: hexColorSchema.optional(),
  })
  .strict()

export const educationSchema = z
  .array(educationItemSchema)
  .min(1)
  .superRefine((education, context) => {
    const seenInstitutions = new Set<string>()

    education.forEach((item, index) => {
      const normalizedInstitution = item.institution.toLocaleLowerCase('en-US')

      if (seenInstitutions.has(normalizedInstitution)) {
        context.addIssue({
          code: 'custom',
          message: 'Education institutions must be unique (case-insensitive)',
          path: [index, 'institution'],
        })
      }

      seenInstitutions.add(normalizedInstitution)
    })
  })
