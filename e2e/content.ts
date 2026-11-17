import { readFileSync } from 'node:fs'

import { z } from 'zod'

// Read raw content independently of the app's mapping and rendering code.
const readContent = (file: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`../src/content/data/${file}.json`, import.meta.url), 'utf8')
  )

export const profile = z
  .object({
    name: z.string(),
    title: z.string(),
    githubUrl: z.string(),
    linkedinUrl: z.string(),
    hero: z.object({ terminalPath: z.string(), certificationsHeading: z.string() }),
    labels: z.object({ projectLiveLabel: z.string(), projectSourceLabel: z.string() }),
    navLinks: z.array(z.object({ label: z.string(), href: z.string() })).min(1),
    certifications: z
      .array(z.object({ imageAlt: z.string(), credentialUrl: z.string() }))
      .min(1),
  })
  .parse(readContent('profile'))

export const projects = z
  .array(
    z.object({
      title: z.string(),
      liveUrl: z.string().optional(),
      repoUrl: z.string().optional(),
    })
  )
  .parse(readContent('projects'))
