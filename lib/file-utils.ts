/**
 * Reads a File as an ArrayBuffer for binary upload
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as ArrayBuffer)
    }
    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }
    reader.readAsArrayBuffer(file)
  })
}

export const downloadTextFile = (
  filename: string,
  content: string,
  mimeType = "text/csv;charset=utf-8"
) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
