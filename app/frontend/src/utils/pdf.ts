import { jsPDF } from 'jspdf'
import type { InvoiceDetail, Settings } from '../api/client'
import logo1Src from '../assets/logo3.png'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 18
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2

const LOGO_NATIVE_WIDTH = 1600
let logoDataUrl: string | null = null

const COLORS = {
  navy: [7, 60, 104] as number[],
  navyLight: [64, 86, 106] as number[],
  blue: [38, 169, 223] as number[],
  cyan: [67, 183, 232] as number[],
  borderLight: [200, 210, 215] as number[],
  text: [30, 40, 50] as number[],
  textLight: [100, 115, 125] as number[],
  white: [255, 255, 255] as number[],
  greenBg: [236, 248, 242] as number[],
  greenText: [7, 60, 104] as number[],
  light: [245, 245, 250] as number[],
  dottedBorder: [180, 190, 195] as number[],
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 80)}`))
    img.src = src
  })
}

async function getLogoDataUrl(): Promise<string> {
  if (logoDataUrl) return logoDataUrl
  const logo = await loadImage(logo1Src)
  const width = logo.naturalWidth || LOGO_NATIVE_WIDTH
  const height = Math.round((logo.naturalHeight / width) * LOGO_NATIVE_WIDTH)
  const canvas = document.createElement('canvas')
  canvas.width = LOGO_NATIVE_WIDTH
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(logo, 0, 0, LOGO_NATIVE_WIDTH, height)
  logoDataUrl = canvas.toDataURL('image/png')
  return logoDataUrl
}

function formatINR(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100
  const parts = rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.')
  return 'Rs. ' + parts[0] + '.' + parts[1]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function drawLine(pdf: jsPDF, x1: number, y1: number, x2: number, y2: number, width = 0.5, color: number[] = COLORS.borderLight): void {
  pdf.setDrawColor(color[0], color[1], color[2])
  pdf.setLineWidth(width)
  pdf.line(x1, y1, x2, y2)
}

function drawRect(pdf: jsPDF, x: number, y: number, w: number, h: number, fillColor: number[], strokeColor?: number[]): void {
  pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2])
  if (strokeColor) {
    pdf.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2])
    pdf.setLineWidth(0.4)
    pdf.rect(x, y, w, h, 'FD')
  } else {
    pdf.rect(x, y, w, h, 'F')
  }
}

function drawDottedLine(pdf: jsPDF, x1: number, y1: number, x2: number, color: number[] = COLORS.dottedBorder, dash = 2, gap = 2): void {
  pdf.setDrawColor(color[0], color[1], color[2])
  pdf.setLineWidth(0.5)
  ;(pdf as any).setLineDashPattern([dash, gap], 0)
  pdf.line(x1, y1, x2, y1)
  ;(pdf as any).setLineDashPattern([], 0)
}

function drawCellText(pdf: jsPDF, text: string, x: number, y: number, align: 'left' | 'center' | 'right', fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal', fontSize = 10, color: number[] = COLORS.text) {
  pdf.setFont('helvetica', fontStyle)
  pdf.setFontSize(fontSize)
  pdf.setTextColor(color[0], color[1], color[2])
  pdf.text(text, x, y, { align })
}

type Align = 'left' | 'center' | 'right'

function cellXFor(colX: number, colW: number, align: Align, pad: number): number {
  if (align === 'right') return colX + colW - pad
  if (align === 'center') return colX + colW / 2
  return colX + pad
}

function drawTable(
  pdf: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
  colWidths: number[],
  aligns: Align[],
  headerBg = COLORS.navy,
  rowStroke = COLORS.cyan,
  altFill?: number[],
): number {
  const pad = 4
  const headerH = 30
  const baseRowH = 26
  const lineH = 13
  const fontSize = 9.5
  const pageBottom = A4_HEIGHT - MARGIN

  const drawHeader = (yy: number) => {
    drawRect(pdf, MARGIN, yy, CONTENT_WIDTH, headerH, headerBg)
    let x = MARGIN
    headers.forEach((h, i) => {
      drawCellText(pdf, h, cellXFor(x, colWidths[i], aligns[i], pad), yy + headerH / 2 + 3.5, aligns[i], 'bold', 10, COLORS.white)
      x += colWidths[i]
    })
  }

  drawHeader(startY)
  let y = startY + headerH

  rows.forEach((row, ri) => {
    const lines = row.map((cell, i) => (aligns[i] === 'left' ? pdf.splitTextToSize(cell, Math.max(colWidths[i] - pad * 2, 20)) : [cell]))
    let maxLines = 1
    lines.forEach((ls: string[]) => (maxLines = Math.max(maxLines, ls.length)))
    const rowH = Math.max(baseRowH, maxLines * lineH + pad * 2)

    if (y + rowH > pageBottom) {
      pdf.addPage('a4', 'portrait')
      y = MARGIN
      drawHeader(y)
      y += headerH
    }

    const fill = altFill && ri % 2 === 1 ? COLORS.light : COLORS.white
    drawRect(pdf, MARGIN, y, CONTENT_WIDTH, rowH, fill, rowStroke)

    let x = MARGIN
    row.forEach((_, i) => {
      const ls = lines[i]
      const startBaseline = y + (rowH - ls.length * lineH) / 2 + 8
      ls.forEach((ln: string, li: number) => {
        drawCellText(pdf, ln, cellXFor(x, colWidths[i], aligns[i], pad), startBaseline + li * lineH, aligns[i], 'normal', fontSize, COLORS.text)
      })
      x += colWidths[i]
    })
    y += rowH
  })

  return y
}

function drawDetailBox(
  pdf: jsPDF,
  rows: { label: string; value: string }[],
  startY: number,
): number {
  const rowH = 25
  const labelW = 128
  const boxW = CONTENT_WIDTH
  const boxH = rows.length * rowH
  const boxX = MARGIN

  pdf.setDrawColor(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2])
  pdf.setLineWidth(1.8)
  pdf.rect(boxX, startY, boxW, boxH, 'S')

  pdf.setDrawColor(COLORS.borderLight[0], COLORS.borderLight[1], COLORS.borderLight[2])
  pdf.setLineWidth(0.8)
  pdf.line(boxX + labelW, startY, boxX + labelW, startY + boxH)

  for (let i = 1; i < rows.length; i++) {
    const ry = startY + i * rowH
    pdf.line(boxX, ry, boxX + boxW, ry)
  }

  rows.forEach((row, i) => {
    const ry = startY + i * rowH
    drawCellText(pdf, row.label, boxX + 8, ry + rowH / 2 + 3, 'left', 'bold', 9.5, COLORS.navy)
    const valueLines = pdf.splitTextToSize(row.value, CONTENT_WIDTH - labelW - 14)
    if (valueLines.length === 1) {
      drawCellText(pdf, row.value, boxX + labelW + 8, ry + rowH / 2 + 3, 'left', 'normal', 9.5, COLORS.text)
    } else {
      const lineH = 12
      valueLines.forEach((ln: string, li: number) => {
        drawCellText(pdf, ln, boxX + labelW + 8, ry + rowH / 2 - (valueLines.length - 1) * lineH / 2 + 3 + li * lineH, 'left', 'normal', 9.5, COLORS.text)
      })
    }
  })

  return startY + boxH
}

export function billPdfFileName(invoice: InvoiceDetail): string {
  const ref = invoice.bill_ref.replace(/[^A-Za-z0-9_-]/g, '_')
  return `${ref}_Bill.pdf`
}

export async function generateInvoicePDF(invoice: InvoiceDetail, settings?: Settings): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true })
  const logoUrl = await getLogoDataUrl()

  const gstEnabled = settings?.gst_enabled ?? false

  const rightX = A4_WIDTH - MARGIN
  let y = MARGIN

  // ========== HEADER ==========
  const logoSectionW = CONTENT_WIDTH * 0.42
  const logoW = Math.min(210, logoSectionW - 10)
  const logoH = Math.round(logoW * (1276 / 4096))
  const logoX = MARGIN + (logoSectionW - logoW) / 2
  pdf.addImage(logoUrl, 'PNG', logoX, y + 8, logoW, logoH)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(27)
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2])
  pdf.text('PRATHAM CAR CARE', rightX, y + 36, { align: 'right' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(14.5)
  pdf.setTextColor(COLORS.navyLight[0], COLORS.navyLight[1], COLORS.navyLight[2])
  pdf.text('Multibrand Car Service', rightX, y + 56, { align: 'right' })

  pdf.setFontSize(10)
  pdf.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2])
  pdf.text('near Vedant Mangalam, Karvenagar, Pune', rightX, y + 74, { align: 'right' })

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(COLORS.navyLight[0], COLORS.navyLight[1], COLORS.navyLight[2])
  pdf.text('Call: 9011560540 / 9665939486', rightX, y + 90, { align: 'right' })

  y = MARGIN + 104

  // ========== HEADER DIVIDER ==========
  drawLine(pdf, MARGIN, y, rightX, y, 2, COLORS.navy)
  drawLine(pdf, MARGIN, y + 2, rightX, y + 2, 1, COLORS.blue)
  y += 14

  // ========== CUSTOMER DETAILS BOX ==========
  y = drawDetailBox(pdf, [
    { label: 'M/s.', value: invoice.owner_name },
    { label: 'Mob.:', value: invoice.owner_phone },
    { label: 'Car No.', value: invoice.plate_number },
    { label: 'Bill No.:', value: invoice.bill_ref },
    { label: 'Km.:', value: invoice.km_reading || '-' },
    { label: 'Date:', value: formatDate(invoice.created_at) },
    { label: 'Next Servicing Km.', value: invoice.next_service_km || '-' },
    { label: 'Next Service Date', value: invoice.next_service_date ? formatDate(invoice.next_service_date) : '-' },
  ], y + 10)

  y += 14

  // ========== ITEMS TABLE (5 cols) ==========
  const headers = ['SR.', 'PARTICULARS', 'QTY', 'RATE (Rs.)', 'AMOUNT (Rs.)']
  const colWidths = [
    CONTENT_WIDTH * 0.06,
    CONTENT_WIDTH * 0.46,
    CONTENT_WIDTH * 0.08,
    CONTENT_WIDTH * 0.2,
    CONTENT_WIDTH * 0.2,
  ]
  const aligns: Align[] = ['center', 'left', 'center', 'right', 'right']

  const rows = invoice.items.map((it, idx) => [
    String(idx + 1),
    it.product_name,
    String(it.quantity),
    formatINR(it.unit_rate),
    formatINR(it.charged_amount),
  ])

  y = drawTable(pdf, headers, rows, y, colWidths, aligns, COLORS.navy, COLORS.cyan, COLORS.light)

  // ========== TAX SUMMARY + TOTAL STRIP ==========
  const grandTotal = invoice.items.reduce((s, it) => s + (parseFloat(String(it.charged_amount)) || 0), 0)

  if (gstEnabled) {
    const taxRate = 0.18
    const cgst = Math.round((grandTotal / (1 + taxRate)) * 0.09 * 100) / 100
    const sgst = Math.round((grandTotal / (1 + taxRate)) * 0.09 * 100) / 100
    const taxable = Math.round((grandTotal - cgst - sgst) * 100) / 100

    const taxRowH = 22
    if (y + taxRowH + 60 > A4_HEIGHT - MARGIN) {
      pdf.addPage('a4', 'portrait')
      y = MARGIN
    }
    drawRect(pdf, MARGIN, y, CONTENT_WIDTH, taxRowH, COLORS.light)
    drawCellText(pdf, 'Taxable', MARGIN + 8, y + taxRowH / 2 + 3, 'left', 'bold', 9, COLORS.text)
    drawCellText(pdf, formatINR(taxable), MARGIN + 58, y + taxRowH / 2 + 3, 'left', 'normal', 9.5, COLORS.text)
    drawCellText(pdf, `CGST @ 9% : ${formatINR(cgst)}`, MARGIN + CONTENT_WIDTH * 0.36, y + taxRowH / 2 + 3, 'left', 'normal', 9.5, COLORS.text)
    drawCellText(pdf, `SGST @ 9% : ${formatINR(sgst)}`, MARGIN + CONTENT_WIDTH * 0.62, y + taxRowH / 2 + 3, 'left', 'normal', 9.5, COLORS.text)
    y += taxRowH + 4
  }

  const stripH = 34
  if (y + stripH + 120 > A4_HEIGHT - MARGIN) {
    pdf.addPage('a4', 'portrait')
    y = MARGIN
  }
  drawRect(pdf, MARGIN, y, CONTENT_WIDTH, stripH, COLORS.greenBg)
  drawCellText(pdf, 'TOTAL', MARGIN + 10, y + stripH / 2 + 3.5, 'left', 'bold', 13, COLORS.greenText)
  drawCellText(pdf, formatINR(grandTotal), rightX - 10, y + stripH / 2 + 3.5, 'right', 'bold', 13, COLORS.greenText)
  y += stripH + 14

  // ========== AMOUNT IN WORDS ==========
  const words = invoice.amount_in_words || ''
  const wordsLines = pdf.splitTextToSize(words, CONTENT_WIDTH - 138)
  const lineH = 13
  const wordsH = Math.max(1, wordsLines.length) * lineH + 8

  if (y + wordsH + 150 > A4_HEIGHT - MARGIN) {
    pdf.addPage('a4', 'portrait')
    y = MARGIN
  }
  drawDottedLine(pdf, MARGIN, y + wordsH - 2, rightX)
  drawCellText(pdf, 'Rs. in words :', MARGIN, y + lineH + 1, 'left', 'bold', 10, COLORS.text)
  wordsLines.forEach((ln: string, li: number) => {
    drawCellText(pdf, ln, MARGIN + 95, y + lineH + 1 + li * lineH, 'left', 'normal', 9.5, COLORS.navyLight)
  })
  y += wordsH + 10

  // ========== SIGNATURE SECTION ==========
  let sigY = y + 34
  if (sigY + 110 > A4_HEIGHT - MARGIN) {
    pdf.addPage('a4', 'portrait')
    sigY = MARGIN + 30
  }
  // Left: Customer's Signature
  drawLine(pdf, MARGIN, sigY, MARGIN + 130, sigY, 1, COLORS.textLight)
  drawCellText(pdf, "Customer's Signature", MARGIN, sigY + 15, 'left', 'normal', 9.5, COLORS.textLight)

  // Center: Thank You
  drawCellText(pdf, 'Thank You...!', A4_WIDTH / 2, sigY + 18, 'center', 'bolditalic', 13, COLORS.navy)

  // Right: For Pratham car care + Proprietor
  const rightSigX = rightX - 130
  drawCellText(pdf, 'For Pratham car care', rightSigX + 65, sigY - 8, 'center', 'bold', 9, COLORS.navy)
  drawLine(pdf, rightSigX, sigY, rightX, sigY, 1, COLORS.textLight)
  drawCellText(pdf, 'Proprietor', rightSigX + 65, sigY + 15, 'center', 'normal', 9.5, COLORS.textLight)

  y = Math.max(sigY + 60, y + 60)

  // ========== GOOGLE REVIEW FOOTER ==========
  if (y + 60 < A4_HEIGHT - MARGIN) {
    y = A4_HEIGHT - MARGIN - 48
  } else {
    y += 4
  }
  drawLine(pdf, MARGIN, y, rightX, y, 1, COLORS.borderLight)
  drawCellText(pdf, 'Loved our service?', A4_WIDTH / 2, y + 14, 'center', 'normal', 9.5, COLORS.textLight)
  drawCellText(pdf, 'Rate us on Google', A4_WIDTH / 2, y + 28, 'center', 'bold', 9.5, COLORS.blue)

  const data = pdf.output('arraybuffer')
  return new Blob([data], { type: 'application/pdf' })
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 5000)
}

export function safeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 80)
}

export function invoiceReadyForPdf(): boolean {
  return true
}

export function invoiceShortText(invoice: InvoiceDetail): string {
  return `Bill ${invoice.bill_ref} — Pratham Car Care, Karvenagar, Pune`
}