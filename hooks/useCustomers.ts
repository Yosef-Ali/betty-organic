import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { getCustomers, deleteCustomer } from '@/app/actions/customersActions';

type FilterStatus = 'all' | 'with-orders' | 'no-orders';

interface Customer {
  id: string;
  fullName: string;
  email: string;
  address?: string;
  imageUrl?: string;
  status: string;
  orders?: Array<{
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export function useCustomers(initialCustomers: Customer[]) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [filteredCustomers, setFilteredCustomers] =
    useState<Customer[]>(customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const { toast } = useToast();

  useEffect(() => {
    const filtered = customers.filter(customer => {
      const matchesSearch =
        customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (filterStatus) {
        case 'with-orders':
          return customer.orders && customer.orders.length > 0;
        case 'no-orders':
          return !customer.orders || customer.orders.length === 0;
        default:
          return true;
      }
    });
    setFilteredCustomers(filtered);
  }, [searchTerm, customers, filterStatus]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const fetchedCustomers = await getCustomers();
      const sortedCustomers = fetchedCustomers.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setCustomers(sortedCustomers);
      setFilteredCustomers(sortedCustomers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteCustomer(id);
      if (result.success) {
        setCustomers(prevCustomers =>
          prevCustomers.filter(customer => customer.id !== id),
        );
        toast({
          title: 'Customer deleted',
          description: 'The customer has been successfully deleted.',
        });
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the customer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    customers,
    filteredCustomers,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    handleDelete,
    fetchCustomers,
  };
}
