import { render, screen } from '@testing-library/react'
import { LuGraduationCap } from 'react-icons/lu'
import { describe, expect, it } from 'vitest'

import { profile } from '@content/profile'

import { EducationSection } from './EducationSection'

import type { EducationItem } from '@features/education'

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

    render(
      <EducationSection
        education={education}
        headingDescription={profile.educationSectionDescription}
        headingEyebrow={profile.educationSectionEyebrow}
        headingTitle={profile.educationSectionTitle}
      />
    )

    const logoImage = screen.getByRole('img', { name: 'Harvard University' })
    expect(logoImage).toBeInTheDocument()
    expect(logoImage).toHaveAttribute(
      'src',
      'https://www.google.com/s2/favicons?sz=256&domain=harvard.edu'
    )
    expect(logoImage).toHaveClass('object-cover')
  })

  it('falls back to icon rendering when no logoUrl is provided', () => {
    const education: EducationItem[] = [
      {
        institution: 'Queensland University of Technology (QUT)',
        degree: 'Bachelor of Business',
        duration: '2020 - 2024',
        achievements: ['Academic Excellence'],
        icon: LuGraduationCap,
      },
    ]

    render(
      <EducationSection
        education={education}
        headingDescription={profile.educationSectionDescription}
        headingEyebrow={profile.educationSectionEyebrow}
        headingTitle={profile.educationSectionTitle}
      />
    )

    expect(
      screen.getByText('Queensland University of Technology (QUT)')
    ).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Bachelor of Business')).toBeInTheDocument()
  })
})
