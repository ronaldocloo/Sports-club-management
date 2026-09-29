export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export default Skeleton
