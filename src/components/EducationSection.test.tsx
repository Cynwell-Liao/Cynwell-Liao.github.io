import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EducationSection } from './EducationSection'

import type { EducationItem } from '../types/portfolio'

describe('EducationSection', () => {
  it('renders the university logo image when logoUrl exists', () => {
    const education: EducationItem[] = [
      {
        institution: 'Harvard University',
        degree: 'Short-term Exchange',
        duration: '2025',
        achievements: ['Exchange scholarship'],
        logoUrl: 'https://www.google.com/s2/favicons?sz=256&domain=harvard.edu',
        color: '#A51C30',
      },
    ]

    render(<EducationSection education={education} />)

    const logoImage = screen.getByRole('img', { name: 'Harvard University' })
    expect(logoImage).toBeInTheDocument()
    expect(logoImage).toHaveAttribute(
      'src',
      'https://www.google.com/s2/favicons?sz=256&domain=harvard.edu'
    )
    expect(logoImage).toHaveClass('object-cover')
  })
})
