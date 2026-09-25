import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SectionHeading } from './SectionHeading'

describe('SectionHeading', () => {
  it('connects the supplied ID to the level-two heading', () => {
    render(
      <SectionHeading
        description="A deterministic section description."
        eyebrow="Example eyebrow"
        id="example-heading"
        title="Example section"
      />
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Example section' })
    ).toHaveAttribute('id', 'example-heading')
    expect(screen.getByText('Example eyebrow')).toBeInTheDocument()
    expect(screen.getByText('A deterministic section description.')).toBeInTheDocument()
  })

  it('renders an optional colored title accent', () => {
    render(
      <SectionHeading
        description="A deterministic section description."
        eyebrow="Example eyebrow"
        id="example-heading"
        title="Engineering mindset,"
        titleAccent="product velocity."
      />
    )

    const accent = screen.getByText('product velocity.')

    expect(accent).toHaveClass('bg-gradient-to-r')
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Engineering mindset, product velocity.',
      })
    ).toBeInTheDocument()
  })
})
