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
