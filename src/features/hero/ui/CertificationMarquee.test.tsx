import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { heroProfile } from '../model/profile.fixture'

import { CertificationMarquee } from './CertificationMarquee'

const certifications = [
  ...heroProfile.heroCertifications,
  {
    credentialUrl: 'https://credentials.example.com/backend',
    imageUrl: 'https://images.example.com/backend.png',
    imageAlt: 'Backend certification badge',
  },
]

const scrollIntoView = vi.fn()

function renderMarquee() {
  const { container } = render(
    <CertificationMarquee
      certifications={certifications}
      heading={heroProfile.heroCertificationsHeading}
    />
  )
  const viewport = container.querySelector<HTMLDivElement>(
    '.hero-cert-marquee__viewport'
  )
  if (!viewport) {
    throw new Error('Expected the certification viewport')
  }
  return { container, viewport, badges: screen.getAllByRole('link') }
}

function bounds(left: number, right: number): DOMRect {
  return {
    left,
    right,
    top: 0,
    bottom: 100,
    width: right - left,
    height: 100,
    x: left,
    y: 0,
    toJSON: () => ({}),
  }
}

describe('CertificationMarquee', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView.mockClear(),
    })
  })
  it('keeps one semantic certification set and non-tabbable visual clones', () => {
    const { container, badges } = renderMarquee()

    expect(
      screen.getByRole('region', {
        name: heroProfile.heroCertificationsHeading,
      })
    ).toBeInTheDocument()
    expect(badges).toHaveLength(certifications.length)
    expect(
      screen.getByRole('img', {
        name: certifications[0].imageAlt,
      })
    ).toHaveAttribute('loading', 'lazy')
    expect(
      screen.getByRole('img', {
        name: certifications[0].imageAlt,
      })
    ).toHaveAttribute('fetchpriority', 'low')
    const clone = container.querySelector('[data-clone="true"]')
    if (!clone) {
      throw new Error('Expected a visual certification clone')
    }
    expect(clone).toHaveAttribute('aria-hidden', 'true')
    for (const badge of clone.querySelectorAll('a')) {
      expect(badge).toHaveAttribute('tabindex', '-1')
    }
  })

  it('shows a readable fallback when a remote image fails', () => {
    renderMarquee()

    fireEvent.error(screen.getByRole('img', { name: certifications[0].imageAlt }))

    expect(
      screen.getByRole('link', {
        name: certifications[0].imageAlt,
      })
    ).toHaveTextContent(certifications[0].imageAlt)
  })

  it('uses intrinsic image dimensions when supplied and defaults to 100px', () => {
    render(
      <CertificationMarquee
        certifications={[
          { ...certifications[0], imageWidth: 240, imageHeight: 180 },
          certifications[1],
        ]}
        heading="Credentials"
      />
    )
    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('width', '240')
    expect(images[0]).toHaveAttribute('height', '180')
    expect(images[1]).toHaveAttribute('width', '100')
    expect(images[1]).toHaveAttribute('height', '100')
  })

  it.each([
    ['before the viewport', -20, 80, 72],
    ['after the viewport', 150, 250, 158],
    ['inside the viewport', 50, 150, 100],
  ])(
    'reveals keyboard focus %s with space for its ring',
    (_label, left, right, expected) => {
      const { viewport, badges } = renderMarquee()
      viewport.scrollLeft = 100
      vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue(bounds(0, 200))
      vi.spyOn(badges[0], 'getBoundingClientRect').mockReturnValue(bounds(left, right))
      vi.spyOn(badges[0], 'matches').mockReturnValue(true)

      fireEvent.focus(badges[0])

      expect(viewport.scrollLeft).toBe(expected)
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'instant',
      })
    }
  )

  it('leaves pointer-focused badges alone', () => {
    const { viewport, badges } = renderMarquee()
    viewport.scrollLeft = 25
    const measure = vi.spyOn(badges[0], 'getBoundingClientRect')
    vi.spyOn(badges[0], 'matches').mockReturnValue(false)

    fireEvent.focus(badges[0])

    expect(viewport.scrollLeft).toBe(25)
    expect(measure).not.toHaveBeenCalled()
  })

  it('corrects native scrolling on the next frame only while the badge retains focus', () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    const { badges } = renderMarquee()
    vi.spyOn(badges[0], 'matches').mockReturnValue(true)
    badges[0].focus()
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    frames.shift()?.(0)
    expect(scrollIntoView).toHaveBeenCalledTimes(2)

    fireEvent.focus(badges[0])
    expect(scrollIntoView).toHaveBeenCalledTimes(3)
    badges[0].blur()
    frames.shift()?.(0)
    expect(scrollIntoView).toHaveBeenCalledTimes(3)
  })

  it('preserves scrolling within the list and resets it when focus leaves', () => {
    const { viewport, badges } = renderMarquee()
    viewport.scrollLeft = 125

    fireEvent.blur(badges[0], { relatedTarget: badges[1] })
    expect(viewport.scrollLeft).toBe(125)
    fireEvent.blur(badges[1], { relatedTarget: null })
    expect(viewport.scrollLeft).toBe(0)
  })
})
