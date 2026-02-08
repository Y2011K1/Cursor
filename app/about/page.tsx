import { LandingHeader } from "@/components/landing-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Code, Target, Mail, CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "About This Website – EduPlatform",
  description: "Learn about this website: purpose, what you'll find, technology used, and future plans.",
}

const cardTransition = "transition-all duration-300 ease-out hover:shadow-lg hover:shadow-deep-teal/5"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <Button
          variant="ghost"
          asChild
          className="mb-6 -ml-2 text-deep-teal transition-colors duration-200 hover:bg-deep-teal/10"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-deep-teal md:text-4xl mb-2 transition-colors duration-200">
          About This Website
        </h1>
        <p className="text-slate-blue text-lg mb-10 transition-colors duration-200">
          What this site is, what you&apos;ll find here, and how it&apos;s built.
        </p>

        <Card className={`border-0 shadow-md mb-8 w-full ${cardTransition}`}>
          <CardContent className="p-6 md:p-8 lg:p-10">
            <p className="text-dark-text leading-relaxed">
              This website was built to showcase ideas, projects, and learning progress using modern web technologies.
              It focuses on clean design, performance, and simplicity.
            </p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-md mb-8 w-full ${cardTransition}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-deep-teal transition-colors duration-200">
              <BookOpen className="h-5 w-5" />
              What You&apos;ll Find Here
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-3 text-dark-text">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-green shrink-0 mt-0.5" aria-hidden />
                <span>Project updates and improvements</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-green shrink-0 mt-0.5" aria-hidden />
                <span>Experiments with modern frameworks</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-green shrink-0 mt-0.5" aria-hidden />
                <span>Learning progress and new features</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-green shrink-0 mt-0.5" aria-hidden />
                <span>Future plans and ideas</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-md mb-8 w-full ${cardTransition}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-deep-teal transition-colors duration-200">
              <Code className="h-5 w-5" />
              Technology Used
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-slate-blue mb-4">This site is built using:</p>
            <ul className="space-y-2 text-dark-text">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-green shrink-0 mt-0.5" aria-hidden />
                <span><strong>Next.js</strong> for fast and modern routing</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-green shrink-0 mt-0.5" aria-hidden />
                <span><strong>React</strong> for interactive UI</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-green shrink-0 mt-0.5" aria-hidden />
                <span><strong>Vercel</strong> for deployment and hosting</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success-green shrink-0 mt-0.5" aria-hidden />
                <span><strong>GitHub</strong> for version control</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-md mb-8 w-full ${cardTransition}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-deep-teal transition-colors duration-200">
              <Target className="h-5 w-5" />
              Purpose
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-dark-text leading-relaxed">
              The goal of this website is to learn, build, and improve continuously while creating something useful and real-world ready.
            </p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-md mb-8 w-full ${cardTransition}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-deep-teal transition-colors duration-200">
              <Mail className="h-5 w-5" />
              Contact / Future Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-dark-text leading-relaxed">
              More features and pages will be added over time as the project grows.
            </p>
          </CardContent>
        </Card>

        <div className="rounded-xl bg-deep-teal/5 border border-deep-teal/20 p-6 md:p-8 text-center transition-all duration-300 ease-out hover:shadow-md hover:border-deep-teal/30">
          <p className="text-slate-blue text-sm mb-4 transition-colors duration-200">
            <strong className="text-deep-teal">Summary:</strong> This info page explains what the site is, what users can expect, what tech we used, and why the site exists.
          </p>
          <Button
            asChild
            className="bg-deep-teal text-white hover:bg-deep-teal/90 transition-colors duration-200"
          >
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
