'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
    data: string | null
    size?: number
    className?: string
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export function QRCodeDisplay({
    data,
    size = 200,
    className = '',
    errorCorrectionLevel = 'M'
}: QRCodeDisplayProps) {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        const generateQRCode = async () => {
            try {
                setLoading(true)
                setError('')

                console.log('🔍 QRCodeDisplay: Received data:', data ? 'Present' : 'Null/Empty', typeof data)

                if (!data || typeof data !== 'string' || !data.trim()) {
                    console.log('⚠️ QRCodeDisplay: No QR code data provided')
                    setError('Waiting for QR code...')
                    setQrCodeUrl('')
                    return
                }

                // Check if data is already a base64 data URL (pre-generated image)
                if (data.startsWith('data:image/')) {
                    console.log('✅ QRCodeDisplay: Using pre-generated QR code image')
                    console.log('🔍 Data URL length:', data.length)
                    setQrCodeUrl(data)
                    return
                }

                // Generate QR code from raw data
                console.log('🔍 QRCodeDisplay: Generating QR code from raw data, length:', data.length)
                const url = await QRCode.toDataURL(data, {
                    width: size,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel
                })

                console.log('✅ QRCodeDisplay: Generated QR code successfully')
                setQrCodeUrl(url)
            } catch (err) {
                console.error('❌ QRCodeDisplay: Failed to generate QR code:', err)
                setError('Failed to generate QR code')
            } finally {
                setLoading(false)
            }
        }

        generateQRCode()
    }, [data, size, errorCorrectionLevel])

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} style={{ width: size, height: size }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`} style={{ width: size, height: size }}>
                <p className="text-red-600 dark:text-red-400 text-sm text-center p-4">{error}</p>
            </div>
        )
    }

    return (
        <div className={`flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 ${className}`}>
            <img
                src={qrCodeUrl}
                alt="QR Code"
                className="rounded-lg"
                style={{ width: size, height: size }}
            />
        </div>
    )
}
