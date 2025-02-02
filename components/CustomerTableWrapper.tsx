'use client';

import { type CustomerWithOrders } from '@/types/customer';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CustomerTableContent from './CustomerTableContent';

interface CustomerTableWrapperProps {
  customers: CustomerWithOrders[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
}

const CustomerTableWrapper = ({
  customers,
  isLoading,
  onDelete,
}: CustomerTableWrapperProps) => (
  <div className="w-full">
    {/* Mobile view - cards layout */}
    <div className="block sm:hidden w-full">
      <CustomerTableContent
        customers={customers}
        isLoading={isLoading}
        onDelete={onDelete}
        view="mobile"
      />
    </div>

    {/* Desktop view - table layout */}
    <div className="hidden sm:block w-full">
      <div className="w-full overflow-x-auto">
        <div className="rounded-md border px-2 pb-2 sm:px-4 sm:pb-4 relative">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden xl:table-cell">Location</TableHead>
                <TableHead className="hidden md:table-cell">Orders</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Last Active
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <CustomerTableContent
              customers={customers}
              isLoading={isLoading}
              onDelete={onDelete}
              view="desktop"
            />
          </Table>
        </div>
      </div>
    </div>
  </div>
);

export default CustomerTableWrapper;
