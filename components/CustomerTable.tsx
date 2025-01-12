'use client'

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

interface Customer {
  id: string;
  fullName?: string;
  full_name?: string;
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


// Update the CustomerWithOrders type definition
type CustomerWithOrders = Customer & {
  orders?: any[]
  imageUrl?: string // Add this line
};

const CustomerTableContent = ({ customers, isLoading, onDelete }: {
  customers: CustomerWithOrders[]
  isLoading: boolean
  onDelete: (id: string) => Promise<void>
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          Loading...
        </TableCell>
      </TableRow>
    )
  }

  if (customers.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          No customers found.
        </TableCell>
      </TableRow>
    )
  }

  return customers.map((customer: CustomerWithOrders) => (
    <TableRow key={customer.id}>
      <TableCell className="hidden sm:table-cell">
        <div className="relative h-12 w-12">
          <Image
            alt="Customer avatar"
            className="rounded-full object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            src={customer.imageUrl || customer.imageUrl || '/uploads/placeholder.svg'}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/uploads/placeholder.svg';
            }}
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">{customer.full_name || customer.fullName}</TableCell>
      <TableCell>{customer.email || 'N/A'}</TableCell>
      <TableCell>{customer.phone || 'N/A'}</TableCell>
      <TableCell>{customer.location || 'N/A'}</TableCell>
      <TableCell>{customer.orders?.length ?? 0}</TableCell>
      <TableCell>
        {customer.createdAt ? formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true }) : 'N/A'}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => router.push(`/dashboard/customers/${customer.id}/edit`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push(`/dashboard/customers/${customer.id}/orders`)}>
              View Orders
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full text-left">Delete</button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the customer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        setDeletingId(customer.id);
                        await onDelete(customer.id);
                        setDeletingId(null);
                      }}
                      disabled={deletingId === customer.id}
                    >
                      {deletingId === customer.id ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  ))
}

interface CustomerTableProps {
  initialCustomers: Customer[];
}

export function CustomerTable({ initialCustomers }: CustomerTableProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithOrders[]>(customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  async function fetchCustomers() {
    setIsLoading(true)
    try {
      const fetchedCustomers = await getCustomers() as CustomerWithOrders[]
      const sortedCustomers = fetchedCustomers.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setCustomers(sortedCustomers)
      setFilteredCustomers(sortedCustomers)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteCustomer(id)
      if (result.success) {
        setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== id))
        toast({
          title: "Customer deleted",
          description: "The customer has been successfully deleted.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: "Error",
        description: "Failed to delete the customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderTable = (customers: CustomerWithOrders[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Avatar</span>
          </TableHead>
          <TableHead>Full Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Number of Orders</TableHead>
          <TableHead>Created at</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <CustomerTableContent
          customers={customers}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </TableBody>
    </Table>
  )

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All Customers</TabsTrigger>
            <TabsTrigger value="no-orders">No Orders</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search customers..."
              className="h-8 w-[150px] lg:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>With Orders</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>No Orders</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={() => router.push('/dashboard/customers/new')}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Customer</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage your customers and view their order history.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(filteredCustomers)}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="no-orders">
          <Card>
            <CardHeader>
              <CardTitle>Customers with No Orders</CardTitle>
              <CardDescription>View and manage customers who haven&apos;t placed any orders yet.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(filteredCustomers.filter(customer => !customer.orders || customer.orders.length === 0))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
