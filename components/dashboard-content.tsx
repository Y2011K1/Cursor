import { Suspense } from 'react'
import { CardSkeleton } from './skeletons'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface DashboardContentProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function DashboardContentSection({ children, title, description }: DashboardContentProps) {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-deep-teal">{title}</CardTitle>
          {description && <p className="text-sm text-slate-blue">{description}</p>}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </Suspense>
  )
}
