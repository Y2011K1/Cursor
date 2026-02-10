import { LandingHeader } from "@/components/landing-header"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service – EduPlatform",
  description: "EduPlatform terms of service.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6 -ml-2 text-deep-teal">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Link>
        </Button>
        <h1 className="text-3xl font-bold text-deep-teal md:text-4xl mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 prose prose-slate max-w-none">
            <p className="text-slate-600">By using EduPlatform you agree to use the service for lawful educational purposes, to keep your account secure, and to follow instructor and course guidelines. We reserve the right to suspend accounts that violate these terms. For full terms, contact support@eduplatform.com.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
