import React from 'react';

export function AiStudioSkeleton() {
  return (
    <div className="container max-w-6xl py-6 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full h-8 w-40 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </div>

      {/* Main grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column - Form skeleton */}
        <div className="rounded-lg border border-gray-200 p-6 space-y-6">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            
            {/* Image upload skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 h-32">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            
            {/* Prompt textarea skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            
            {/* Category buttons skeleton */}
            <div className="space-y-3">
              <div>
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Generate button skeleton */}
            <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Right column - Image preview skeleton */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="p-0 relative h-full flex flex-col">
            <div className="flex items-center justify-center bg-gray-50 aspect-square md:aspect-auto md:h-full min-h-[400px]">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4 animate-pulse" />
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}