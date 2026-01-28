import { Loader2 } from "lucide-react"

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-light-sky via-white to-light-sky flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-deep-teal mx-auto mb-4" />
        <p className="text-slate-blue font-medium text-lg">Loading admin dashboard...</p>
        <p className="text-slate-blue/70 text-sm mt-2">Please wait</p>
      </div>
    </div>
  )
}
