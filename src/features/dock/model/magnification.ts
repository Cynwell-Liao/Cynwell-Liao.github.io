export const DOCK_ICON_SIZE = 52
export const DOCK_MAGNIFICATION = 26
export const DOCK_INFLUENCE = 140
export const DOCK_GAP = 8

/** A cosine falloff keeps the hovered icon and its neighbors on one smooth curve. */
export function getDockIconSize(distance: number): number {
  const proximity = Math.min(Math.abs(distance) / DOCK_INFLUENCE, 1)
  return DOCK_ICON_SIZE + ((Math.cos(proximity * Math.PI) + 1) / 2) * DOCK_MAGNIFICATION
}

/**
 * Solve the lens against its final layout, never against animating DOM bounds.
 * Repeated pointer events at one position therefore produce identical targets.
 * The separator belongs to the layout, but does not magnify.
 */
export function getDockSizes(
  pointerOffset: number,
  minimized: boolean,
  availableWidth = Infinity
): number[] {
  const count = minimized ? 4 : 3
  let sizes: number[] = Array.from({ length: count }, () => DOCK_ICON_SIZE)
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const width =
      sizes.reduce((sum, size) => sum + size, 0) +
      DOCK_GAP * (count - 1) +
      (minimized ? DOCK_GAP + 1 : 0)
    let left = -width / 2
    sizes = sizes.map((size, index) => {
      if (minimized && index === 3) left += DOCK_GAP + 1
      const target = getDockIconSize(pointerOffset - left - size / 2)
      left += size + DOCK_GAP
      return (size + target) / 2
    })
  }
  const extra = sizes.reduce((sum, size) => sum + size - DOCK_ICON_SIZE, 0)
  const restingWidth =
    count * DOCK_ICON_SIZE + DOCK_GAP * (count - 1) + (minimized ? DOCK_GAP + 1 : 0)
  const scale =
    extra > 0 ? Math.min(1, Math.max(0, availableWidth - restingWidth) / extra) : 1
  return sizes.map((size) => DOCK_ICON_SIZE + (size - DOCK_ICON_SIZE) * scale)
}
