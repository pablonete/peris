export function parseCsvRecords(content: string): Record<string, string>[] {
  const rows = parseCsvRows(content)
  if (rows.length === 0) {
    return []
  }

  const [headers, ...dataRows] = rows

  return dataRows
    .filter((row) => row.some((value) => value.trim() !== ""))
    .map((row) =>
      headers.reduce<Record<string, string>>((record, header, index) => {
        record[header] = row[index] ?? ""
        return record
      }, {})
    )
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ""
  let quoted = false

  for (let index = 0; index < content.length; index++) {
    const char = content[index]
    const nextChar = content[index + 1]

    if (char === '"') {
      if (quoted && nextChar === '"') {
        currentValue += '"'
        index++
        continue
      }

      quoted = !quoted
      continue
    }

    if (char === "," && !quoted) {
      currentRow.push(currentValue)
      currentValue = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") {
        index++
      }

      currentRow.push(currentValue)
      rows.push(currentRow)
      currentRow = []
      currentValue = ""
      continue
    }

    currentValue += char
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue)
    rows.push(currentRow)
  }

  return rows
}
