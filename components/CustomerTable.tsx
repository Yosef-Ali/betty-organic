"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, MoreHorizontal, ListFilter, File } from 'lucide-react'
import { getCustomers, deleteCustomer } from '@/app/actions/customersActions'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useCustomers } from '@/hooks/useCustomers';
import CustomerRow from './CustomerRow';
import CustomerTableContent from './CustomerTableContent';
import CustomerTableWrapper from './CustomerTableWrapper';
import { type CustomerWithOrders } from '@/types/customer';

interface Customer {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  location?: string;
  status: string;
  orders?: Array<{
    id: string;
    customerId: string;
    product: string;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

interface CustomerTableProps {
  initialCustomers: Customer[];
}

export function CustomerTable({ initialCustomers }: CustomerTableProps) {
  const router = useRouter();
  const {
    filteredCustomers,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    handleDelete
  } = useCustomers(initialCustomers);

  return (
    <main className="grid flex-1 gap-4 md:p-4 md:gap-8">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <TabsList className="flex flex-wrap gap-1.5 justify-start">
            <TabsTrigger
              value="all"
              className="text-xs sm:text-sm px-2.5 sm:px-3"
            >
              All Customers
            </TabsTrigger>
            <TabsTrigger
              value="no-orders"
              className="text-xs sm:text-sm px-2.5 sm:px-3"
            >
              No Orders
            </TabsTrigger>
          </TabsList>

          {/* Search and actions toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <div className="w-full sm:w-auto flex flex-1 sm:flex-initial">
              <Input
                type="search"
                placeholder="Search customers..."
                className="h-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 ml-auto sm:ml-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <ListFilter className="h-3.5 w-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Orders</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filterStatus === 'all'}
                    onCheckedChange={() => setFilterStatus('all')}
                  >
                    All Customers
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterStatus === 'with-orders'}
                    onCheckedChange={() => setFilterStatus('with-orders')}
                  >
                    With Orders
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterStatus === 'no-orders'}
                    onCheckedChange={() => setFilterStatus('no-orders')}
                  >
                    No Orders
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8">
                      <File className="h-3.5 w-3.5 sm:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    <p>Export customer data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => router.push('/dashboard/customers/new')}
                    >
                      <PlusCircle className="h-3.5 w-3.5 sm:mr-2" />
                      <span className="hidden sm:inline">Add Customer</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="md:hidden">
                    <p>Add New Customer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>View and manage all your customers.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <CustomerTableWrapper
                customers={filteredCustomers}
                isLoading={isLoading}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="no-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customers Without Orders</CardTitle>
              <CardDescription>View customers who haven't placed any orders yet.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CustomerTableWrapper
                customers={filteredCustomers.filter(customer => !customer.orders || customer.orders.length === 0)}
                isLoading={isLoading}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
