export function formatMoney(value, currency = 'GH₵') {
  return `${currency}${Number(value).toLocaleString('en-GH')}`
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(value).toLocaleDateString('en-GB', options)
}
