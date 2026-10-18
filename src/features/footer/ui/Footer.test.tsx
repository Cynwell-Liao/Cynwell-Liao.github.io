import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Footer } from './Footer'

describe('Footer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the copyright with the current year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-06-15T00:00:00Z'))

    render(
      <Footer
        name="Example Engineer"
        repositoryUrl="https://github.com/example/portfolio"
      />
    )

    expect(screen.getByText('© 2030 Example Engineer')).toBeInTheDocument()
  })

  it('derives a readable repository label and exposes safe outbound attributes', () => {
    render(
      <Footer
        name="Example Engineer"
        repositoryUrl="https://github.com/example/portfolio/"
      />
    )

    const link = screen.getByRole('link', {
      name: 'github.com/example/portfolio',
    })

    expect(link).toHaveAttribute('href', 'https://github.com/example/portfolio/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })
})
