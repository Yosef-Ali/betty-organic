export function NavSkeleton() {
  return (
    <div className="animate-pulse flex items-center space-x-4 p-4 border-b">
      <div className="h-8 w-8 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}
