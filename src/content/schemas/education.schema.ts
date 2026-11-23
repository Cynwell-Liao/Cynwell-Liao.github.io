import { z } from 'zod'

import { hexColorSchema, httpsUrlSchema, nonBlankTextSchema } from './primitives'

export const educationItemSchema = z
  .object({
    institution: nonBlankTextSchema,
    location: nonBlankTextSchema.optional(),
    degree: nonBlankTextSchema,
    duration: nonBlankTextSchema,
    achievements: z.array(nonBlankTextSchema).min(1),
    logoUrl: httpsUrlSchema.optional(),
    color: hexColorSchema.optional(),
  })
  .strict()
  .superRefine((item, context) => {
    const seenAchievements = new Set<string>()
    item.achievements.forEach((achievement, index) => {
      const normalizedAchievement = achievement.toLocaleLowerCase('en-US')
      if (seenAchievements.has(normalizedAchievement)) {
        context.addIssue({
          code: 'custom',
          message: 'Education achievements must be unique (case-insensitive)',
          path: ['achievements', index],
        })
      }
      seenAchievements.add(normalizedAchievement)
    })
  })

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
