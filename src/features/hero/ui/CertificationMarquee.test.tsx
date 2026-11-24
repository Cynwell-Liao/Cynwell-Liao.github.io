import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getRequired } from '../../../test/getRequired'
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

const getBadge = (badges: readonly HTMLElement[], index: number): HTMLElement => {
  const badge = badges[index]
  if (!badge) throw new Error(`Expected certification badge at index ${String(index)}`)
  return badge
}

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
    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[0]).toHaveAttribute('fetchpriority', 'high')
    expect(images[1]).toHaveAttribute('loading', 'eager')
    expect(images[1]).toHaveAttribute('fetchpriority', 'auto')
    const clone = container.querySelector('[data-clone="true"]')
    if (!clone) {
      throw new Error('Expected a visual certification clone')
    }
    expect(clone).toHaveAttribute('aria-hidden', 'true')
    for (const badge of clone.querySelectorAll('a')) {
      expect(badge).toHaveAttribute('tabindex', '-1')
    }
    for (const image of clone.querySelectorAll('img')) {
      expect(image).toHaveAttribute('loading', 'eager')
      expect(image).toHaveAttribute('fetchpriority', 'low')
    }
  })

  it('shows a readable fallback when a remote image fails', () => {
    renderMarquee()

    const certification = getRequired(certifications, 0, 'certification fixture')
    fireEvent.error(screen.getByRole('img', { name: certification.imageAlt }))

    expect(
      screen.getByRole('link', {
        name: certification.imageAlt,
      })
    ).toHaveTextContent(certification.imageAlt)
  })

  it('zooms for mouse hover and touch press without leaving feedback active', () => {
    const { badges } = renderMarquee()
    const badge = getBadge(badges, 0)

    fireEvent.pointerEnter(badge, { pointerType: 'mouse' })
    expect(badge).toHaveAttribute('data-pointer-hover', 'true')
    fireEvent.pointerLeave(badge, { pointerType: 'mouse' })
    expect(badge).not.toHaveAttribute('data-pointer-hover')

    fireEvent.pointerEnter(badge, { pointerType: 'touch' })
    expect(badge).not.toHaveAttribute('data-pointer-hover')

    fireEvent.pointerDown(badge, { isPrimary: true, pointerType: 'touch' })
    expect(badge).toHaveAttribute('data-pointer-hover', 'true')
    fireEvent.pointerCancel(badge, { pointerType: 'touch' })
    expect(badge).not.toHaveAttribute('data-pointer-hover')

    fireEvent.pointerEnter(badge, { pointerType: 'mouse' })
    fireEvent.blur(window)
    expect(badge).not.toHaveAttribute('data-pointer-hover')
  })

  it('uses intrinsic image dimensions when supplied and defaults to 100px', () => {
    render(
      <CertificationMarquee
        certifications={[
          {
            ...getRequired(certifications, 0, 'certification fixture'),
            imageWidth: 240,
            imageHeight: 180,
          },
          getRequired(certifications, 1, 'certification fixture'),
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
      const badge = getBadge(badges, 0)
      viewport.scrollLeft = 100
      vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue(bounds(0, 200))
      vi.spyOn(badge, 'getBoundingClientRect').mockReturnValue(bounds(left, right))
      vi.spyOn(badge, 'matches').mockReturnValue(true)

      fireEvent.focus(badge)

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
    const badge = getBadge(badges, 0)
    viewport.scrollLeft = 25
    const measure = vi.spyOn(badge, 'getBoundingClientRect')
    vi.spyOn(badge, 'matches').mockReturnValue(false)

    fireEvent.focus(badge)

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
    const badge = getBadge(badges, 0)
    vi.spyOn(badge, 'matches').mockReturnValue(true)
    badge.focus()
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    frames.shift()?.(0)
    expect(scrollIntoView).toHaveBeenCalledTimes(2)

    fireEvent.focus(badge)
    expect(scrollIntoView).toHaveBeenCalledTimes(3)
    badge.blur()
    frames.shift()?.(0)
    expect(scrollIntoView).toHaveBeenCalledTimes(3)
  })

  it('preserves scrolling within the list and resets it when focus leaves', () => {
    const { viewport, badges } = renderMarquee()
    const firstBadge = getBadge(badges, 0)
    const secondBadge = getBadge(badges, 1)
    viewport.scrollLeft = 125

    fireEvent.blur(firstBadge, { relatedTarget: secondBadge })
    expect(viewport.scrollLeft).toBe(125)
    fireEvent.blur(secondBadge, { relatedTarget: null })
    expect(viewport.scrollLeft).toBe(0)
  })
})
