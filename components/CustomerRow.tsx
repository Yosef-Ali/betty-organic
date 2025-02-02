'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TableCell, TableRow } from '@/components/ui/table';
import type { CustomerWithOrders } from '@/types/customer';

interface CustomerRowProps {
  customer: CustomerWithOrders;
  deletingId: string | null;
  onDelete: (id: string) => Promise<void>;
  view: 'mobile' | 'desktop';
}

export default function CustomerRow({
  customer,
  deletingId,
  onDelete,
  view,
}: CustomerRowProps) {
  const router = useRouter();

  const ActionMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/dashboard/customers/${customer.id}/edit`)
          }
        >
          Edit customer
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/dashboard/customers/${customer.id}/orders`)
          }
        >
          View orders
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive"
              onSelect={e => e.preventDefault()}
            >
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                customer&apos;s account and remove their data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await onDelete(customer.id);
                }}
                disabled={deletingId === customer.id}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingId === customer.id ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (view === 'mobile') {
    return (
      <div className="block sm:hidden card p-4 shadow rounded border w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image
                alt="Customer avatar"
                className="rounded-full object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={customer.imageUrl || '/uploads/placeholder.svg'}
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/uploads/placeholder.svg';
                }}
              />
            </div>
            <div className="space-y-1">
              <div className="font-medium">
                {customer.full_name || customer.fullName}
              </div>
              <div className="text-sm text-muted-foreground">
                {customer.email || 'N/A'}
              </div>
            </div>
          </div>
          <ActionMenu />
        </div>

        {/* Contact Info Section */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Contact</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm font-medium">Phone</div>
              <div className="text-sm">{customer.phone || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Location</div>
              <div className="text-sm">{customer.location || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Orders</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm font-medium">Total Orders</div>
              <div className="text-sm">{customer.orders?.length ?? 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Last Active</div>
              <div className="text-sm">
                {customer.createdAt
                  ? formatDistanceToNow(new Date(customer.createdAt), {
                      addSuffix: true,
                    })
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TableRow className="hidden sm:table-row">
      <TableCell className="hidden sm:table-cell">
        <div className="relative h-10 w-10">
          <Image
            alt="Customer avatar"
            className="rounded-full object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            src={customer.imageUrl || '/uploads/placeholder.svg'}
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.src = '/uploads/placeholder.svg';
            }}
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {customer.full_name || customer.fullName}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {customer.email || 'N/A'}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {customer.phone || 'N/A'}
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        {customer.location || 'N/A'}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {customer.orders?.length ?? 0}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {customer.createdAt
          ? formatDistanceToNow(new Date(customer.createdAt), {
              addSuffix: true,
            })
          : 'N/A'}
      </TableCell>
      <TableCell className="text-right">
        <ActionMenu />
      </TableCell>
    </TableRow>
  );
}
