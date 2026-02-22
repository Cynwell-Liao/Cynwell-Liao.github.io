import type { IconType } from 'react-icons'

export interface EducationItem {
  institution: string
  location?: string
  degree: string
  duration: string
  achievements: string[]
  icon?: IconType
  logoUrl?: string
  color?: string
}
