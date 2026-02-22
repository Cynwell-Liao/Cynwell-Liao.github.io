import type { IconType } from 'react-icons'

export interface ProfileData {
  name: string
  title: string
  tagline: string
  about: string[]
  githubUsername: string
  githubUrl: string
  resumePath: string
}

export interface SocialLink {
  label: string
  href: string
  icon?: IconType
}
