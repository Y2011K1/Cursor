"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log error for debugging
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-sky px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-warm-coral">Error Loading Dashboard</CardTitle>
          <CardDescription>
            {error.message || "An unexpected error occurred"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-blue">
            This might happen if your profile hasn&apos;t been created yet. Please try logging out and back in.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                router.push("/login")
                router.refresh()
              }}
              className="flex-1"
            >
              Go to Login
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
