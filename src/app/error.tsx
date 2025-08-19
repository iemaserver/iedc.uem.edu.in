'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground mt-2">
          We encountered an unexpected error. Please try again.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => reset()}
          variant="default"
        >
          Try again
        </Button>
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
        >
          Go home
        </Button>
      </div>
    </div>
  )
}
