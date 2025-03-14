import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { ExtendedOrder } from '@/types/order';
import { formatOrderId } from '@/lib/utils';
import { updateOrderStatus } from '@/app/actions/orderActions';
import { toast } from 'sonner';

export const columns: ColumnDef<ExtendedOrder>[] = [
  {
    accessorKey: 'id',
    header: 'Order ID',
    cell: ({ row }) => (
      <div className="cursor-pointer hover:underline">
        {row.original.display_id || formatOrderId(row.original.id)}
      </div>
    ),
    enableGlobalFilter: true,
  },
  {
    id: 'profile_name',
    header: 'Profile',
    accessorFn: row => row.profiles?.name || 'Unknown Customer',
    cell: ({ row }) => row.original.profiles?.name || 'Unknown Customer',
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
    accessorKey: 'total_amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        Br {row.original.total_amount?.toFixed(2) || '0.00'}
      </div>
    ),
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'created_at',
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {new Date(row.original.created_at || '').toLocaleDateString()}
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

      const handleStatusUpdate = async (status: string) => {
        try {
          const result = await updateOrderStatus(row.original.id, status);
          if (result.success) {
            toast.success('Order status updated successfully');
          } else {
            toast.error('Failed to update order status');
          }
        } catch (error) {
          toast.error('Error updating order status');
        }
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => meta.onSelect(row.original.id)}>
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleStatusUpdate('pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('processing')}>
                Processing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('completed')}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('cancelled')}>
                Cancelled
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
