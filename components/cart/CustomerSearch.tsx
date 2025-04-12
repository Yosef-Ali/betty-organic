// components/cart/CustomerSearch.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { getCustomers } from '@/app/actions/customersActions';

interface Customer {
  id: string;
  fullName: string;
  email: string;
  address?: string;
  imageUrl?: string;
  status?: string;
  orders?: any[];
  created_at?: string;
  updated_at?: string;
  phone?: string | null;
}

interface CustomerSearchProps {
  onSelectCustomer: (customer: Customer | null) => void;
}

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  onSelectCustomer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Fetch initial customer list once on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const results = await getCustomers();
        setCustomers(results.slice(0, 10)); // Show first 10 customers by default
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  // Filter customers when search text changes
  useEffect(() => {
    const filterCustomers = async () => {
      try {
        if (customerSearch.trim() === '') {
          // If search is empty, get top 10 customers
          const results = await getCustomers();
          setCustomers(results.slice(0, 10));
        } else {
          // Otherwise fetch all and filter client-side
          const results = await getCustomers();
          const filtered: Customer[] = results.filter((customer: Customer) =>
            customer.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
            customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
          );
          setCustomers(filtered);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomers([]);
      }
    };

    const debounceTimer = setTimeout(filterCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [customerSearch]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    onSelectCustomer(customer);
    setIsOpen(false);
  };

  return (
    <div>
      <Label htmlFor="customer-search" className="text-sm font-medium">
        Customer (Optional)
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            {selectedCustomer
              ? selectedCustomer.fullName
              : 'Search customers...'}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="Search customers..."
              value={customerSearch}
              onValueChange={setCustomerSearch}
            />
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map(customer => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => handleSelectCustomer(customer)}
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback>
                      {customer.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {customer.fullName}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
