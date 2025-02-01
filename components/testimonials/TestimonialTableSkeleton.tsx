import { Avatar } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export function TestimonialTableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="min-w-0 space-y-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="h-4 w-[200px] bg-muted animate-pulse rounded" />
          </TableCell>
          <TableCell>
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </TableCell>
          <TableCell>
            <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
          </TableCell>
          <TableCell>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled>
              <span className="sr-only">Menu</span>
              <MoreHorizontal className="h-4 w-4 text-muted" />
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function MobileTestimonialSkeleton() {
  return (
    <>
      {[1, 2, 3].map((index) => (
        <div key={index} className="card p-4 shadow rounded border w-full space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex gap-2 pt-3 border-t">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      ))}
    </>
  );
}
