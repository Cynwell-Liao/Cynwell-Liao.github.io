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
    statusLabel: nonBlankTextSchema,
    terminalPath: nonBlankTextSchema,
    terminalDirectories: z.array(nonBlankTextSchema).min(1),
    terminalPrompt: nonBlankTextSchema,
    certificationsHeading: nonBlankTextSchema,
  })
  .strict()

const labelsSchema = z
  .object({
    githubLabel: nonBlankTextSchema,
    linkedinLabel: nonBlankTextSchema,
    linkedinConnectionsLabel: nonBlankTextSchema,
    contributionsLoadingLabel: nonBlankTextSchema,
    contributionsSuffixLabel: nonBlankTextSchema,
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
    footerAttribution: nonBlankTextSchema,
  })
  .strict()

export const profileSchema = z
  .object({
    name: nonBlankTextSchema,
    brandName: nonBlankTextSchema,
    title: nonBlankTextSchema,
    tagline: nonBlankTextSchema,
    githubUsername: nonBlankTextSchema,
    githubUrl: httpsUrlSchema,
    repositoryUrl: httpsUrlSchema,
    linkedinUrl: httpsUrlSchema,
    linkedinConnectionCount: z.number().int().nonnegative(),
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
