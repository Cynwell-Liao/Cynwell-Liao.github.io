import { z } from 'zod'

import { hexColorSchema, iconKeySchema, nonBlankTextSchema } from './primitives'

export const skillItemSchema = z
  .object({
    name: nonBlankTextSchema,
    note: nonBlankTextSchema,
    icon: iconKeySchema,
    color: hexColorSchema.optional(),
  })
  .strict()

export const skillCategorySchema = z
  .object({
    title: nonBlankTextSchema,
    items: z.array(skillItemSchema).min(1),
  })
  .strict()
  .superRefine((category, context) => {
    const seenNames = new Set<string>()

    category.items.forEach((item, index) => {
      const normalizedName = item.name.toLocaleLowerCase('en-US')

      if (seenNames.has(normalizedName)) {
        context.addIssue({
          code: 'custom',
          message: 'Skill names must be unique within a category (case-insensitive)',
          path: ['items', index, 'name'],
        })
      }

      seenNames.add(normalizedName)
    })
  })

export const skillCategoriesSchema = z
  .array(skillCategorySchema)
  .min(1)
  .superRefine((categories, context) => {
    const seenTitles = new Set<string>()

    categories.forEach((category, index) => {
      const normalizedTitle = category.title.toLocaleLowerCase('en-US')

      if (seenTitles.has(normalizedTitle)) {
        context.addIssue({
          code: 'custom',
          message: 'Skill category titles must be unique (case-insensitive)',
          path: [index, 'title'],
        })
      }

      seenTitles.add(normalizedTitle)
    })
  })
