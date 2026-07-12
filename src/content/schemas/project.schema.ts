import { z } from 'zod'

import { httpsUrlSchema, nonBlankTextSchema } from './primitives'

const projectIdSchema = nonBlankTextSchema.regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/iu,
  'Must be a slug containing only letters, numbers, and single hyphens'
)

export const projectSchema = z
  .object({
    id: projectIdSchema,
    title: nonBlankTextSchema,
    summary: nonBlankTextSchema,
    highlights: z.array(nonBlankTextSchema).min(1),
    stack: z.array(nonBlankTextSchema).min(1),
    repoUrl: httpsUrlSchema.optional(),
    liveUrl: httpsUrlSchema.optional(),
  })
  .strict()

export const projectsSchema = z
  .array(projectSchema)
  .min(1)
  .superRefine((projects, context) => {
    const seenIds = new Set<string>()

    projects.forEach((project, index) => {
      const normalizedId = project.id.toLocaleLowerCase('en-US')

      if (seenIds.has(normalizedId)) {
        context.addIssue({
          code: 'custom',
          message: 'Project IDs must be unique (case-insensitive)',
          path: [index, 'id'],
        })
      }

      seenIds.add(normalizedId)
    })
  })
