import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { ExtendedOrder } from '@/types';

export const columns: ColumnDef<ExtendedOrder>[] = [
  {
    accessorKey: 'id',
    header: 'Order ID',
    cell: ({ row }) => (
      <div className="cursor-pointer hover:underline">{row.original.id}</div>
    ),
    enableGlobalFilter: true,
  },
  {
    id: 'profile_name',
    header: 'Profile',
    accessorFn: row => row.profile?.name || 'N/A',
    cell: ({ row }) => row.original.profile?.name || 'N/A',
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="text-right">
          <Badge
            variant={
              status === 'completed'
                ? 'default'
                : status === 'pending'
                ? 'secondary'
                : 'destructive'
            }
          >
            {status}
          </Badge>
        </div>
      );
    },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'totalAmount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        Br {row.original.totalAmount?.toFixed(2) || '0.00'}
      </div>
    ),
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'createdAt',
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </div>
    ),
    enableGlobalFilter: true,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onDelete: (id: string) => Promise<void>;
        onSelect: (id: string) => void;
      };

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => meta.onSelect(row.original.id)}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta.onDelete(row.original.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableGlobalFilter: false,
  },
];
