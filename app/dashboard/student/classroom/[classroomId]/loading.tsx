import { SkeletonCardGrid } from "@/components/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentClassroomLoading() {
  return (
    <div className="min-h-screen bg-light-sky">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <SkeletonCardGrid count={6} />
        </div>
      </div>
    </div>
  )
}
