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
import { searchCustomers } from '@/app/actions/profile';

interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
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

  useEffect(() => {
    const searchCustomersDebounced = setTimeout(async () => {
      if (customerSearch) {
        try {
          const results = await searchCustomers(customerSearch);
          setCustomers(Array.isArray(results) ? results : []);
        } catch (error) {
          console.error('Error searching customers:', error);
          setCustomers([]);
        }
      } else {
        setCustomers([]);
      }
    }, 300);

    return () => clearTimeout(searchCustomersDebounced);
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
