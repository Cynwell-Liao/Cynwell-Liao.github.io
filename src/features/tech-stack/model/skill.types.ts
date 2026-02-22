import type { IconType } from 'react-icons'

export interface SkillItem {
  name: string
  note: string
  icon: IconType
  color?: string
}

export interface SkillCategory {
  title: string
  items: SkillItem[]
}
