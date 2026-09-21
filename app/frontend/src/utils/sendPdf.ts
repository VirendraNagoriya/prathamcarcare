import type { InvoiceDetail, Settings } from '../api/client'
import { makeBillPdfBlob, billPdfFileName, downloadBlob } from './pdf'
import { openWhatsApp, buildBillShareMessage } from './whatsapp'

export type PdfSendResult = 'direct' | 'downloaded' | 'no-phone'

export async function sendBillPdfToCustomer(
  invoice: InvoiceDetail,
  settings?: Settings,
): Promise<PdfSendResult> {
  const blob = await makeBillPdfBlob()
  const fileName = billPdfFileName(invoice)

  if (!invoice.owner_phone) return 'no-phone'

  // WhatsApp does not allow attaching a file to a specific number via URL,
  // so: open the chat directly with the customer's number + written message
  // (with Google review link), and save the PDF locally to attach in that chat.
  downloadBlob(blob, fileName)
  openWhatsApp(invoice.owner_phone, buildBillShareMessage(invoice, settings))
  return 'direct'
}

export async function downloadBillPdf(invoice: InvoiceDetail): Promise<void> {
  const blob = await makeBillPdfBlob()
  downloadBlob(blob, billPdfFileName(invoice))
}