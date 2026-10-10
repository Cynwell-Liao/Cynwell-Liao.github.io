export const DOCK_ICON_SIZE = 52
export const DOCK_MAGNIFICATION = 26
export const DOCK_INFLUENCE = 140

/** A cosine falloff keeps the hovered icon and its neighbors on one smooth curve. */
export function getDockIconSize(distance: number): number {
  const proximity = Math.min(Math.abs(distance) / DOCK_INFLUENCE, 1)
  return DOCK_ICON_SIZE + ((Math.cos(proximity * Math.PI) + 1) / 2) * DOCK_MAGNIFICATION
}
