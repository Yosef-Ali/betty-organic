'use client'

import { useEffect, useState } from 'react';
import { getCustomers } from '@/app/actions/customersActions';
import { Customer } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from 'next/link';
import { Edit, Trash } from 'lucide-react';

interface CustomerListClientProps {
  initialCustomers: Customer[];
}

export function CustomerListClient({ initialCustomers }: CustomerListClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(() => 
    initialCustomers.map(customer => ({
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: customer.updatedAt ? new Date(customer.updatedAt) : undefined
    }))
  );

  const handleCustomersUpdated = async () => {
    const updatedCustomers = await getCustomers();
    setCustomers(updatedCustomers);
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.full_name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.location}</TableCell>
              <TableCell>
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/customers/${customer.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Add delete functionality here
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
