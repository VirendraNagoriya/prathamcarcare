const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
const TEENS = ['', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number): string {
  if (n <= 0) return ''
  if (n < 10) return ONES[n]
  if (n < 20) return n === 10 ? 'Ten' : TEENS[n - 10]
  const ten = Math.floor(n / 10)
  const one = n % 10
  return TENS[ten] + (one ? ' ' + ONES[one] : '')
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100)
  const r = n % 100
  let out = ''
  if (h) out += ONES[h] + ' Hundred'
  if (r) out += (out ? ' ' : '') + twoDigits(r)
  return out
}

export function amountInWords(amount: number): string {
  const paiseValue = Math.round(amount * 100)
  const paise = paiseValue % 100
  let whole = Math.floor(paiseValue / 100)

  const parts: string[] = []
  const crore = Math.floor(whole / 10000000)
  whole %= 10000000
  const lakh = Math.floor(whole / 100000)
  whole %= 100000
  const thousand = Math.floor(whole / 1000)
  whole %= 1000

  if (crore) parts.push(threeDigits(crore) + ' Crore')
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh')
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand')
  if (whole) parts.push(threeDigits(whole))

  let words = parts.length ? parts.join(' ') + ' Rupees' : 'Zero Rupees'
  if (paise) words += ' and ' + twoDigits(paise) + ' Paise'
  return words.charAt(0).toUpperCase() + words.slice(1) + ' Only'
}