export function getPreviousQuarterId(quarterId: string): string {
  const match = quarterId.match(/^(\d{4})\.(\d)Q$/)
  if (!match) return quarterId
  const year = parseInt(match[1], 10)
  const quarter = parseInt(match[2], 10)
  if (quarter === 1) return `${year - 1}.4Q`
  return `${year}.${quarter - 1}Q`
}

export function getYearAgoQuarterId(quarterId: string): string {
  const match = quarterId.match(/^(\d{4})\.(\d)Q$/)
  if (!match) return quarterId
  return `${parseInt(match[1], 10) - 1}.${match[2]}Q`
}
