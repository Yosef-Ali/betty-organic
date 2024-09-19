import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@prisma/client";
import { OrderType } from "./OrderDashboard";

export interface ExtendedOrder extends Order {
  customer: {
    fullName: string;
    email: string;
    imageUrl: string;
  } | null;
  type: OrderType; // Add this line
}

type OrderProps = {
  orders: ExtendedOrder[];
};

export function OrderTable({ orders }: OrderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead> {/* Add this line */}
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={order.customer?.imageUrl || '/public/uploads/default.jpg'}
                        alt={order.customer?.fullName || 'Customer'}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer?.fullName || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{order.type}</TableCell> {/* Add this line */}
                <TableCell>{new Date(order.createdAt).toISOString().split('T')[0]}</TableCell>
                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}