import { ReactNode } from "react"
import { Breadcrumbs, BreadcrumbItem } from "./breadcrumbs"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="mb-4" />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-deep-teal mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-slate-blue">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}
