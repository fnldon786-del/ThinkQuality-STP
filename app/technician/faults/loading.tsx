export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
          <div className="h-4 bg-muted rounded w-48 mt-2 animate-pulse" />
        </div>
      </div>

      <div className="h-32 bg-muted rounded animate-pulse" />
      <div className="h-96 bg-muted rounded animate-pulse" />
    </div>
  )
}
