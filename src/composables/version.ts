export function generateDates() {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - i)
    return `${date.getUTCFullYear()}.${date.getUTCMonth() + 1}.${date.getUTCDate()}`
  })
}
