"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkStatus() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setDebugInfo({
            error: "Not authenticated",
            userError: userError?.message,
          })
          setLoading(false)
          return
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setDebugInfo({
          user: {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at,
          },
          profile: profile || null,
          profileError: profileError ? {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          } : null,
        })
      } catch (err: any) {
        setDebugInfo({
          error: err.message,
          stack: err.stack,
        })
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-sky">
        <p className="text-slate-blue">Loading debug info...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-sky p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              This page shows your authentication and profile status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-50 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Try Dashboard Again
              </Button>
              <Button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push("/login")
                }}
                variant="outline"
                className="w-full"
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
