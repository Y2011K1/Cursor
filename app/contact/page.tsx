import { LandingHeader } from "@/components/landing-header"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail } from "lucide-react"

export const metadata = {
  title: "Contact – EduPlatform",
  description: "Get in touch with EduPlatform.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6 -ml-2 text-deep-teal">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Link>
        </Button>
        <h1 className="text-3xl font-bold text-deep-teal md:text-4xl mb-2">Contact</h1>
        <p className="text-slate-blue mb-8">Get in touch with us.</p>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-deep-teal">
              <Mail className="h-6 w-6" />
              <span className="font-medium">Email</span>
            </div>
            <p className="mt-2 text-slate-blue">support@eduplatform.com</p>
            <p className="mt-6 text-sm text-slate-500">We aim to respond within 1–2 business days.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
