import { z } from 'zod'

import {
  httpsUrlSchema,
  navigationFragmentSchema,
  nonBlankTextSchema,
  positiveDimensionSchema,
} from './primitives'

const certificationSchema = z
  .object({
    credentialUrl: httpsUrlSchema,
    imageUrl: httpsUrlSchema,
    imageAlt: nonBlankTextSchema,
    imageWidth: positiveDimensionSchema.optional(),
    imageHeight: positiveDimensionSchema.optional(),
  })
  .strict()

const navLinkSchema = z
  .object({
    label: nonBlankTextSchema,
    href: navigationFragmentSchema,
  })
  .strict()

const aboutSchema = z
  .object({
    headingLead: nonBlankTextSchema,
    headingAccent: nonBlankTextSchema,
    intro: nonBlankTextSchema,
    paragraphs: z.array(nonBlankTextSchema).min(1),
  })
  .strict()

const heroSchema = z
  .object({
    // Accepted for existing forks; the UI now displays the deployed version.
    statusLabel: nonBlankTextSchema.optional(),
    terminalPath: nonBlankTextSchema,
    terminalDirectories: z.array(nonBlankTextSchema).min(1),
    // Legacy decorative cursor setting; terminal input owns its caret rendering.
    terminalPrompt: nonBlankTextSchema.optional(),
    certificationsHeading: nonBlankTextSchema,
  })
  .strict()

const labelsSchema = z
  .object({
    techStackSectionEyebrow: nonBlankTextSchema,
    techStackSectionTitle: nonBlankTextSchema,
    techStackSectionDescription: nonBlankTextSchema,
    projectsSectionEyebrow: nonBlankTextSchema,
    projectsSectionTitle: nonBlankTextSchema,
    projectsSectionDescription: nonBlankTextSchema,
    projectLiveLabel: nonBlankTextSchema,
    projectSourceLabel: nonBlankTextSchema,
    educationSectionEyebrow: nonBlankTextSchema,
    educationSectionTitle: nonBlankTextSchema,
    educationSectionDescription: nonBlankTextSchema,
  })
  .strict()

export const profileSchema = z
  .object({
    name: nonBlankTextSchema,
    brandName: nonBlankTextSchema,
    title: nonBlankTextSchema,
    // Legacy copy accepted at the input boundary, omitted from runtime props.
    tagline: nonBlankTextSchema.optional(),
    githubUsername: nonBlankTextSchema,
    githubUrl: httpsUrlSchema,
    repositoryUrl: httpsUrlSchema,
    linkedinUrl: httpsUrlSchema,
    about: aboutSchema,
    hero: heroSchema,
    certifications: z.array(certificationSchema).min(1),
    navLinks: z.array(navLinkSchema).min(1),
    labels: labelsSchema,
  })
  .strict()
  .superRefine((rawProfile, context) => {
    const seenTargets = new Set<string>()

    rawProfile.navLinks.forEach((link, index) => {
      const normalizedTarget = link.href.toLocaleLowerCase('en-US')

      if (seenTargets.has(normalizedTarget)) {
        context.addIssue({
          code: 'custom',
          message: 'Navigation targets must be unique (case-insensitive)',
          path: ['navLinks', index, 'href'],
        })
      }

      seenTargets.add(normalizedTarget)
    })
  })
