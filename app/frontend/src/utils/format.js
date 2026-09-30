export function formatMoney(value, currency = 'GH₵') {
  const n = Number(value)
  return `${n < 0 ? '-' : ''}${currency}${Math.abs(n).toLocaleString('en-GH')}`
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(value).toLocaleDateString('en-GB', options)
}
