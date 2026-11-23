const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number) {
  return currency.format(value)
}

export function formatSigned(value: number) {
  const formatted = formatCurrency(Math.abs(value))
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}
