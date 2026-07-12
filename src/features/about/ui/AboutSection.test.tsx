import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setMockReducedMotion } from '../../../test/setup'

import { AboutSection } from './AboutSection'

const renderAbout = () =>
  render(
    <AboutSection
      headingAccent="with care."
      headingLead="Engineering"
      intro="A deterministic introduction."
      paragraphs={['First test paragraph.', 'Second test paragraph.']}
    />
  )

describe('AboutSection', () => {
  it('exposes a labelled section and renders every supplied paragraph', () => {
    renderAbout()

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Engineering with care.',
    })
    const region = screen.getByRole('region', { name: 'Engineering with care.' })

    expect(heading).toHaveAttribute('id', 'about-heading')
    expect(region).toHaveAttribute('id', 'about')
    expect(region).toHaveAttribute('aria-labelledby', 'about-heading')
    expect(screen.getByText('A deterministic introduction.')).toBeInTheDocument()
    expect(screen.getByText('First test paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second test paragraph.')).toBeInTheDocument()
  })

  it('renders safely with both reduced and standard motion preferences', () => {
    setMockReducedMotion(true)
    const { rerender } = renderAbout()

    expect(
      screen.getByRole('region', { name: 'Engineering with care.' })
    ).toBeInTheDocument()

    setMockReducedMotion(false)
    rerender(
      <AboutSection
        headingAccent="with care."
        headingLead="Engineering"
        intro="A deterministic introduction."
        paragraphs={['First test paragraph.', 'Second test paragraph.']}
      />
    )

    expect(
      screen.getByRole('region', { name: 'Engineering with care.' })
    ).toBeInTheDocument()
  })
})
