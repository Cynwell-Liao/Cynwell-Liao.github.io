import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createEducationItem } from '../../../test/factories/portfolio'

import { EducationSection } from './EducationSection'

const headingProps = {
  headingDescription: 'A deterministic learning history.',
  headingEyebrow: 'Learning',
  headingTitle: 'Education history',
} as const

describe('EducationSection', () => {
  it('renders a labelled section with education details', () => {
    render(<EducationSection {...headingProps} education={[createEducationItem()]} />)

    const region = screen.getByRole('region', { name: 'Education history' })

    expect(region).toHaveAttribute('id', 'education')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Education history' })
    ).toHaveAttribute('id', 'education-heading')
    expect(
      within(region).getByRole('heading', {
        level: 3,
        name: 'Example Institute of Technology',
      })
    ).toBeInTheDocument()
    expect(within(region).getByText('Example City')).toBeInTheDocument()
    expect(
      within(region).getByText('Master of Software Engineering')
    ).toBeInTheDocument()
    expect(within(region).getByText('Graduated with distinction')).toBeInTheDocument()
  })

  it('loads remote logos lazily as decorative media', () => {
    const { container } = render(
      <EducationSection {...headingProps} education={[createEducationItem()]} />
    )
    const logo = container.querySelector('img')

    expect(logo).not.toBeNull()
    expect(logo).toHaveAttribute('alt', '')
    expect(logo).toHaveAttribute('src', 'https://example.com/institute.png')
    expect(logo).toHaveAttribute('loading', 'lazy')
    expect(logo).toHaveAttribute('decoding', 'async')
    expect(logo).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(logo).toHaveAttribute('width', '56')
    expect(logo).toHaveAttribute('height', '56')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('removes a failed logo and its container while preserving education details', () => {
    const { container } = render(
      <EducationSection {...headingProps} education={[createEducationItem()]} />
    )
    const logo = container.querySelector('img')
    const logoContainer = logo?.parentElement?.parentElement

    expect(logo).not.toBeNull()
    expect(logoContainer).toBeInTheDocument()
    fireEvent.error(logo as HTMLImageElement)

    expect(logoContainer).not.toBeInTheDocument()
    expect(screen.getByText('Example Institute of Technology')).toBeInTheDocument()
    expect(screen.getByText('Master of Software Engineering')).toBeInTheDocument()
    expect(screen.getByText('Graduated with distinction')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('supports education entries without optional location or color metadata', () => {
    const item = createEducationItem({
      color: undefined,
      location: undefined,
    })
    const { container } = render(
      <EducationSection {...headingProps} education={[item]} />
    )

    expect(screen.queryByText('Example City')).not.toBeInTheDocument()
    expect(container.querySelector('img')).toBeInTheDocument()
    expect(screen.getByText('Graduated with distinction')).toBeInTheDocument()
  })

  it('preserves education details without an empty logo container when no URL is configured', () => {
    const item = createEducationItem({ logoUrl: undefined })
    const { container } = render(
      <EducationSection {...headingProps} education={[item]} />
    )

    const institutionHeading = screen.getByRole('heading', {
      level: 3,
      name: 'Example Institute of Technology',
    })

    expect(institutionHeading).toBeInTheDocument()
    expect(institutionHeading.parentElement?.parentElement?.children).toHaveLength(1)
    expect(screen.getByText('Master of Software Engineering')).toBeInTheDocument()
    expect(screen.getByText('Graduated with distinction')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })
})
