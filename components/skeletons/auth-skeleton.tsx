import { Skeleton } from '@/components/ui/skeleton';

export function AuthSkeleton() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32 ml-2" />
        </div>
        <div className="relative z-20 mt-auto">
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="p-6 space-y-4 bg-card rounded-lg border shadow-sm">
            <div className="space-y-2 text-center">
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4 mt-4">
              <Skeleton className="h-4 w-32 mx-auto" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Skeleton className="w-full h-[1px]" />
                </div>
                <div className="relative flex justify-center">
                  <Skeleton className="h-4 w-40 bg-background" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
