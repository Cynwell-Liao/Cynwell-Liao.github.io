import { z } from 'zod'

const certificationSchema = z.object({
  credentialUrl: z.url(),
  imageUrl: z.url(),
  imageAlt: z.string().min(1),
  imageWidth: z.number().optional(),
  imageHeight: z.number().optional(),
})

const navLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().startsWith('#'),
})

const aboutSchema = z.object({
  headingLead: z.string().min(1),
  headingAccent: z.string().min(1),
  intro: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
})

const heroSchema = z.object({
  statusLabel: z.string().min(1),
  terminalPath: z.string().min(1),
  terminalDirectories: z.array(z.string()),
  terminalPrompt: z.string().min(1),
  certificationsHeading: z.string().min(1),
})

const labelsSchema = z.object({
  githubLabel: z.string().min(1),
  linkedinLabel: z.string().min(1),
  linkedinConnectionsLabel: z.string().min(1),
  contributionsLoadingLabel: z.string().min(1),
  contributionsSuffixLabel: z.string().min(1),
  techStackSectionEyebrow: z.string().min(1),
  techStackSectionTitle: z.string().min(1),
  techStackSectionDescription: z.string().min(1),
  projectsSectionEyebrow: z.string().min(1),
  projectsSectionTitle: z.string().min(1),
  projectsSectionDescription: z.string().min(1),
  projectLiveLabel: z.string().min(1),
  projectSourceLabel: z.string().min(1),
  educationSectionEyebrow: z.string().min(1),
  educationSectionTitle: z.string().min(1),
  educationSectionDescription: z.string().min(1),
  footerAttribution: z.string().min(1),
})

export const profileSchema = z.object({
  name: z.string().min(1),
  brandName: z.string().min(1),
  title: z.string().min(1),
  tagline: z.string().min(1),
  githubUsername: z.string().min(1),
  githubUrl: z.url(),
  repositoryUrl: z.url(),
  linkedinUrl: z.url(),
  linkedinConnectionCount: z.number().int().nonnegative(),
  about: aboutSchema,
  hero: heroSchema,
  certifications: z.array(certificationSchema),
  navLinks: z.array(navLinkSchema).min(1),
  labels: labelsSchema,
})
