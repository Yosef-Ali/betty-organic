'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, MoreHorizontal, ListFilter, File } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getUsers, deleteUser } from '@/app/actions/userActions'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from 'next/image'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'

interface User {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role?: string;
  imageUrl?: string;
  status: string;
  lastActive?: string;
  createdAt: Date;
  updatedAt: Date;
}

type UserWithDetails = User & {
  imageUrl?: string
};

const UserTableContent = ({ users, isLoading, onDelete }: {
  users: UserWithDetails[]
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

  if (users.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          No users found.
        </TableCell>
      </TableRow>
    )
  }

  return users.map((user: UserWithDetails) => (
    <TableRow key={user.id}>
      <TableCell className="hidden sm:table-cell">
        <div className="relative h-12 w-12">
          <Image
            alt="User avatar"
            className="rounded-full object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            src={user.imageUrl || '/uploads/placeholder.svg'}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/uploads/placeholder.svg';
            }}
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">{user.full_name || user.name}</TableCell>
      <TableCell>{user.email || 'N/A'}</TableCell>
      <TableCell>{user.role || 'N/A'}</TableCell>
      <TableCell>{user.status}</TableCell>
      <TableCell>{user.lastActive || 'N/A'}</TableCell>
      <TableCell>
        {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'N/A'}
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
            <DropdownMenuItem onSelect={() => router.push(`/dashboard/users/${user.id}/edit`)}>
              Edit
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
                      This action cannot be undone. This will permanently delete the user.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        setDeletingId(user.id);
                        await onDelete(user.id);
                        setDeletingId(null);
                      }}
                      disabled={deletingId === user.id}
                    >
                      {deletingId === user.id ? 'Deleting...' : 'Delete'}
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

interface UserTableProps {
  initialUsers: UserWithDetails[];
}

export function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState<UserWithDetails[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      setFilteredUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      toast({
        title: 'User deleted',
        description: 'The user has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const renderTable = (users: UserWithDetails[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Avatar</span>
          </TableHead>
          <TableHead>Full Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead>Created at</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <UserTableContent
          users={users}
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
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Users</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search users..."
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
                <DropdownMenuCheckboxItem checked>Active</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Inactive</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={() => router.push('/dashboard/users/new')}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add User</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage your system users and their permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(filteredUsers)}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Users</CardTitle>
              <CardDescription>View and manage inactive system users.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(filteredUsers.filter(user => user.status === 'inactive'))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
