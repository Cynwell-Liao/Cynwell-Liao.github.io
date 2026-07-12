import type { EducationItem } from '@shared/types/portfolio.types'

import rawEducation from '../data/education.json'
import { educationSchema } from '../schemas/education.schema'

import { parseContent } from './parseContent'

export const parseEducation = (input: unknown): readonly EducationItem[] =>
  parseContent(educationSchema, input, 'content/data/education.json')

export const education = parseEducation(rawEducation)
