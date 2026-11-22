export const getRequired = <Item>(
  items: readonly Item[],
  index: number,
  label = 'item'
): Item => {
  const item = items[index]
  if (item === undefined) {
    throw new RangeError(`Expected ${label} at index ${String(index)}`)
  }
  return item
}
