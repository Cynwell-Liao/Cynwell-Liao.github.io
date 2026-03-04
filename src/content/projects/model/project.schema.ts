import { z } from 'zod'

export const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string()),
  stack: z.array(z.string()),
  repoUrl: z.url().optional(),
  liveUrl: z.url().optional(),
})

export const projectsSchema = z.array(projectSchema)
