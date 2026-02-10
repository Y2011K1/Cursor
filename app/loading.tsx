export default function Loading() {
  return (
    <div className="min-h-screen bg-light-sky flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-deep-teal/20" />
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    </div>
  )
}
