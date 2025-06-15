// Re-export core WhatsApp functionality from split modules
// This file serves as a backward compatibility layer

// Core functions and types
export {
  type WhatsAppSettings,
  getWhatsAppSettings,
  updateWhatsAppSettings,
  formatPhoneNumber,
  testWhatsAppConnection,
  getWhatsAppDiagnostics
} from '@/lib/whatsapp/core'

// Invoice and receipt functions
export {
  sendCustomerInvoiceWhatsApp,
  sendSalesReceiptWhatsApp,
  sendCustomerReceiptWhatsApp,
  sendImageInvoiceWhatsApp,
  sendImageDataToWhatsApp
} from '@/lib/whatsapp/invoices'

// Notification and PDF functions
export {
  sendAdminWhatsAppNotification,
  sendPDFReceiptWhatsApp
} from '@/lib/whatsapp/notifications'