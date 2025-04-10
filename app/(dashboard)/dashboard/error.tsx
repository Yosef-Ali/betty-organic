'use client'

import { useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      digest: error?.digest
    })
  }, [error])

  // Convert the error to a readable format
  const errorMessage =
    typeof error === 'object' && error !== null
      ? error.message || JSON.stringify(error, null, 2)
      : 'An unexpected error occurred';

  return (
    <div className="container mx-auto p-6">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          {errorMessage}
        </AlertDescription>
      </Alert>

      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
