import { z } from 'zod'

export const skillItemSchema = z.object({
  name: z.string().min(1),
  note: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().optional(),
})

export const skillCategorySchema = z.object({
  title: z.string().min(1),
  items: z.array(skillItemSchema).min(1),
})

export const skillCategoriesSchema = z.array(skillCategorySchema)
