import { SkeletonCardGrid } from "@/components/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClassroomLoading() {
  return (
    <div className="min-h-screen bg-light-sky">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96 mb-4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <SkeletonCardGrid count={6} />
        </div>
      </div>
    </div>
  )
}
