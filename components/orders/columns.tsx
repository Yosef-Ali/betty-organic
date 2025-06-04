import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ExtendedOrder } from "@/types/order";
import { formatOrderId, formatOrderCurrency } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions/orderActions";
import { toast } from "sonner";

export const columns: ColumnDef<ExtendedOrder>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => (
      <div>{row.original.display_id || formatOrderId(row.original.id)}</div>
    ),
    enableGlobalFilter: true,
  },
  {
    id: "profile_name",
    header: "Profile",
    accessorFn: (row) => {
      // Check for available customer identification in order of preference
      if (row.profiles?.name) return row.profiles.name;
      if (row.profiles?.email) return row.profiles.email;
      if (row.profiles?.phone) return row.profiles.phone;
      return "Unknown Customer";
    },
    cell: ({ row }) => {
      // Check for available customer identification in order of preference
      const profile = row.original.profiles;
      if (profile?.name) return profile.name;
      if (profile?.email) return profile.email;
      if (profile?.phone) return profile.phone;
      return "Unknown Customer";
    },
    enableGlobalFilter: true,
  },
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="text-right">
          <Badge
            variant={
              status === "completed"
                ? "default"
                : status === "pending"
                ? "secondary"
                : "destructive"
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
    accessorKey: "total_amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatOrderCurrency(row.original.total_amount || 0)}
      </div>
    ),
    enableGlobalFilter: true,
  },
  {
    accessorKey: "created_at",
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {new Date(row.original.created_at || "").toLocaleDateString()}
      </div>
    ),
    enableGlobalFilter: true,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onDelete: (id: string) => Promise<void>;
        onSelect: (id: string) => void;
        handleActionClick?: (
          e: React.MouseEvent,
          id: string,
          action: string
        ) => void;
      };

      const handleStatusUpdate = async (
        e: React.MouseEvent,
        status: string
      ) => {
        e.stopPropagation(); // Prevent row click
        try {
          const result = await updateOrderStatus(row.original.id, status);
          if (result.success) {
            toast.success("Order status updated successfully");
          } else {
            toast.error("Failed to update order status");
          }
        } catch (error) {
          toast.error("Error updating order status");
        }
      };

      const handleClick = (e: React.MouseEvent, action: string) => {
        e.stopPropagation(); // Prevent the row click event

        if (meta.handleActionClick) {
          meta.handleActionClick(e, row.original.id, action);
        } else {
          // Fallback to old behavior if handleActionClick is not provided
          if (action === "view") {
            meta.onSelect(row.original.id);
          } else if (action === "delete") {
            meta.onDelete(row.original.id);
          }
        }
      };

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()} // Prevent row click
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={(e) => handleClick(e, "view")}>
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => handleStatusUpdate(e, "pending")}
              >
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleStatusUpdate(e, "processing")}
              >
                Processing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleStatusUpdate(e, "completed")}
              >
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleStatusUpdate(e, "cancelled")}
              >
                Cancelled
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => handleClick(e, "delete")}>
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
