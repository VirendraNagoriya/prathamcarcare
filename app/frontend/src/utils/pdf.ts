import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import type { InvoiceDetail } from '../api/client'

const INVOICE_ID = 'invoice-print'
const A5_WIDTH = 419.53
const A5_HEIGHT = 595.28
const MARGIN = 16

// Render the bill at fixed A5@96dpi width (559px) then oversample it heavily,
// so the shared PDF stays HD even on phones whose screens are narrower.
const CLONE_WIDTH_PX = 559
const RENDER_SCALE = 5

function toSvgDataUrl(svg: SVGSVGElement): string {
  const xml = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  return URL.createObjectURL(blob)
}

function svgToImages(container: HTMLElement): void {
  const svgs = Array.from(container.querySelectorAll('svg'))
  for (const svg of svgs) {
    const img = document.createElement('img')
    img.src = toSvgDataUrl(svg)
    img.width = svg.clientWidth || 90
    img.height = svg.clientHeight || 90
    img.style.width = `${img.width}px`
    img.style.height = `${img.height}px`
    img.alt = ''
    svg.parentNode?.replaceChild(img, svg)
  }
}

// Make sure every image in the clone is fully decoded before capture,
// otherwise html2canvas can snapshot a half-loaded/blurry logo.
function preloadImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'))
  return Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
        setTimeout(resolve, 4000)
      })
    }),
  ).then(() => undefined)
}

function getInvoiceElement(): HTMLElement {
  const el = document.getElementById(INVOICE_ID)
  if (!el) throw new Error('Invoice sheet not found')
  return el
}

async function renderSheet(): Promise<HTMLCanvasElement> {
  const source = getInvoiceElement()

  const clone = source.cloneNode(true) as HTMLElement
  clone.style.position = 'absolute'
  clone.style.left = '-10000px'
  clone.style.top = '0'
  clone.style.width = `${CLONE_WIDTH_PX}px`
  clone.style.minWidth = `${CLONE_WIDTH_PX}px`
  clone.style.maxWidth = 'none'
  clone.style.margin = '0'
  clone.style.background = '#ffffff'
  document.body.appendChild(clone)
  try {
    svgToImages(clone)
    await preloadImages(clone)
    // Provide our own canvas whose context uses high-quality image smoothing,
    // so downscaled raster images (e.g. the large logo) stay sharp in the PDF.
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
    }
    await html2canvas(clone, {
      canvas,
      scale: RENDER_SCALE,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      width: CLONE_WIDTH_PX,
      windowWidth: CLONE_WIDTH_PX,
      imageTimeout: 20000,
    })
    return canvas
  } finally {
    clone.remove()
  }
}

export function billPdfFileName(invoice: InvoiceDetail): string {
  const ref = invoice.bill_ref.replace(/[^A-Za-z0-9_-]/g, '_')
  return `${ref}_Bill.pdf`
}

export async function makeBillPdfBlob(): Promise<Blob> {
  const canvas = await renderSheet()

  const contentW = A5_WIDTH - MARGIN * 2
  const scale = contentW / canvas.width
  const contentH = canvas.height * scale
  const pages = Math.max(1, Math.ceil(contentH / (A5_HEIGHT - MARGIN * 2)))
  const pageH = Math.min(contentH, A5_HEIGHT - MARGIN * 2)

  const pdf = new jsPDF({ unit: 'pt', format: 'a5', orientation: 'portrait', compress: true })
  const imgData = canvas.toDataURL('image/png')

  if (pages === 1) {
    pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, contentW, contentH, undefined, 'SLOW')
  } else {
    const partH = canvas.height / pages
    for (let p = 0; p < pages; p++) {
      if (p > 0) pdf.addPage('a5', 'portrait')
      const part = document.createElement('canvas')
      part.width = canvas.width
      part.height = Math.ceil(partH)
      const ctx = part.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context unavailable')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, part.width, part.height)
      ctx.drawImage(canvas, 0, p * partH, canvas.width, partH, 0, 0, canvas.width, partH)
      pdf.addImage(part.toDataURL('image/png'), 'PNG', MARGIN, MARGIN, contentW, pageH, undefined, 'SLOW')
    }
  }

  const data = pdf.output('arraybuffer')
  return new Blob([data], { type: 'application/pdf' })
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function safeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 80)
}

export function invoiceReadyForPdf(): boolean {
  return typeof document !== 'undefined' && !!document.getElementById(INVOICE_ID)
}

export function invoiceShortText(invoice: InvoiceDetail): string {
  return `Bill ${invoice.bill_ref} — Pratham Car Care, Karvenagar, Pune`
}