export function ProductFormSkeleton() {
  return (
    <div className="space-y-6 p-6 mx-auto max-w-5xl">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="ml-auto h-5 w-20 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Grid layout skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        {/* Product Details Card */}
        <div className="rounded-lg border p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Product Image Card */}
        <div className="rounded-lg border p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="aspect-square w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square w-full bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-center gap-2 md:hidden">
        <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
