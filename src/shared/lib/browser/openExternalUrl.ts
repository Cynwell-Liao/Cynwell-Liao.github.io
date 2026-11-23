/**
 * Open an external destination without relying on asynchronous popups in touch
 * browsers and embedded WebViews, which commonly discard transient activation.
 */
export function openExternalUrl(
  url: string,
  location: Pick<Location, 'assign'> = window.location
) {
  const isTouchPrimary = window.matchMedia('(pointer: coarse), (hover: none)').matches

  if (!isTouchPrimary && navigator.userActivation.isActive) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  location.assign(url)
}
