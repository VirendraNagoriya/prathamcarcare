import type { InvoiceDetail, Settings } from '../api/client'
import { generateInvoicePDF, billPdfFileName, downloadBlob } from './pdf'
import { openWhatsApp, buildBillShareMessage } from './whatsapp'
import { api } from '../api/client'

export type PdfSendResult = 'direct' | 'downloaded' | 'no-phone'

async function getSettings(): Promise<Settings | undefined> {
  try {
    return await api.getSettings()
  } catch {
    return undefined
  }
}

export async function sendBillPdfToCustomer(
  invoice: InvoiceDetail,
  settings?: Settings,
): Promise<PdfSendResult> {
  const s = settings ?? await getSettings()
  const blob = await generateInvoicePDF(invoice, s)
  const fileName = billPdfFileName(invoice)

  if (!invoice.owner_phone) return 'no-phone'

  downloadBlob(blob, fileName)
  openWhatsApp(invoice.owner_phone, buildBillShareMessage(invoice, s))
  return 'direct'
}

export async function downloadBillPdf(invoice: InvoiceDetail): Promise<void> {
  const s = await getSettings()
  const blob = await generateInvoicePDF(invoice, s)
  downloadBlob(blob, billPdfFileName(invoice))
}