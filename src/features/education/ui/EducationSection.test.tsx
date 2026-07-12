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

  it('falls back to the configured icon when a remote logo fails', () => {
    const { container } = render(
      <EducationSection {...headingProps} education={[createEducationItem()]} />
    )
    const logo = container.querySelector('img')

    expect(logo).not.toBeNull()
    fireEvent.error(logo as HTMLImageElement)

    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('removes failed logo media gracefully when no fallback icon exists', () => {
    const item = createEducationItem({ icon: undefined })
    const { container } = render(
      <EducationSection {...headingProps} education={[item]} />
    )
    const logo = container.querySelector('img')

    expect(logo).not.toBeNull()
    fireEvent.error(logo as HTMLImageElement)

    expect(screen.getByText('Example Institute of Technology')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('supports education entries without optional location or color metadata', () => {
    const item = createEducationItem({
      color: undefined,
      location: undefined,
      logoUrl: undefined,
    })
    const { container } = render(
      <EducationSection {...headingProps} education={[item]} />
    )

    expect(screen.queryByText('Example City')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Graduated with distinction')).toBeInTheDocument()
  })

  it('renders no empty brand mark when neither a logo nor icon is configured', () => {
    const item = createEducationItem({ icon: undefined, logoUrl: undefined })
    const { container } = render(
      <EducationSection {...headingProps} education={[item]} />
    )

    expect(screen.getByText('Example Institute of Technology')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })
})
