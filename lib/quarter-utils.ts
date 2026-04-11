function getQuarterParts(quarterId: string) {
  const match = quarterId.match(/^(\d{4})\.(\d)Q$/)
  if (!match) return null

  return {
    year: parseInt(match[1], 10),
    quarter: parseInt(match[2], 10),
  }
}

export function getPreviousQuarterId(quarterId: string): string {
  const quarterParts = getQuarterParts(quarterId)
  if (!quarterParts) return quarterId
  const { year, quarter } = quarterParts
  if (quarter === 1) return `${year - 1}.4Q`
  return `${year}.${quarter - 1}Q`
}

export function getNextQuarterId(quarterId: string): string {
  const quarterParts = getQuarterParts(quarterId)
  if (!quarterParts) return quarterId
  const { year, quarter } = quarterParts
  if (quarter === 4) return `${year + 1}.1Q`
  return `${year}.${quarter + 1}Q`
}

export function getYearAgoQuarterId(quarterId: string): string {
  const quarterParts = getQuarterParts(quarterId)
  if (!quarterParts) return quarterId
  return `${quarterParts.year - 1}.${quarterParts.quarter}Q`
}
