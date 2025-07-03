'use client'

import { useEffect } from 'react'

interface AutoWhatsAppOpenerProps {
  whatsappUrl: string | null
  orderId: string
  onOpened?: () => void
}

export function AutoWhatsAppOpener({ whatsappUrl, orderId, onOpened }: AutoWhatsAppOpenerProps) {
  useEffect(() => {
    if (whatsappUrl && typeof window !== 'undefined') {
      // Small delay to ensure order is saved
      const timer = setTimeout(() => {
        // Open WhatsApp in new tab
        const newWindow = window.open(whatsappUrl, '_blank')
        
        // Check if popup was blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          console.warn('WhatsApp popup was blocked. Admin should click the notification manually.')
        } else {
          console.log(`✅ WhatsApp opened automatically for order ${orderId}`)
          onOpened?.()
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [whatsappUrl, orderId, onOpened])

  return null // This component doesn't render anything
}
