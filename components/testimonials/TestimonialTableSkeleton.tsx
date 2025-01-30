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
