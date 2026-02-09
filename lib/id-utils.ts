export function generateNextId<T extends { id: string }>(
  items: T[],
  prefix: string
): string {
  const extractNumericId = (item: T) => {
    const [, numStr] = item.id.split(`${prefix}-`)
    return parseInt(numStr, 10) || 0
  }

  const maxId = Math.max(0, ...items.map(extractNumericId))
  return `${prefix}-${maxId + 1}`
}
