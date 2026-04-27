import { z } from 'zod'

export const educationItemSchema = z.object({
  institution: z.string().min(1),
  location: z.string().optional(),
  degree: z.string().min(1),
  duration: z.string().min(1),
  achievements: z.array(z.string()),
  icon: z.string().optional(),
  logoUrl: z.url().optional(),
  color: z.string().optional(),
})

export const educationSchema = z.array(educationItemSchema)
