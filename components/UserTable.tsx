'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { getUsers, deleteUser } from '@/app/actions/userActions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'

interface User {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  avatar_url?: string;
}

function UserTableContent({ users, isLoading, onDelete }: {
  users: User[]
  isLoading: boolean
  onDelete: (id: string) => Promise<void>
}) {
  const router = useRouter()
  const { toast } = useToast()

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="h-24 text-center">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (!users || users.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="h-24 text-center">
          No users found.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {users.map((user) => (
        <TableRow key={user.id}>
          <TableCell>
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {(user.name || user.email || user.id).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {user.name || user.email || `User ${user.id.slice(0, 8)}`}
                </div>
                {user.email && (
                  <div className="text-sm text-gray-500">{user.email}</div>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell>{user.role || 'user'}</TableCell>
          <TableCell>
            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {user.status || 'active'}
            </div>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user
                        account and remove their data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(user.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const fetchedUsers = await getUsers()
        setUsers(fetchedUsers)
        setFilteredUsers(fetchedUsers)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(user => {
      if (!searchTerm) return true
      const lowerSearchTerm = searchTerm.toLowerCase()
      const searchableFields = [
        user.name,
        user.email,
        user.role,
        user.id
      ].filter(Boolean)
      return searchableFields.some(field =>
        field?.toString().toLowerCase().includes(lowerSearchTerm)
      )
    })
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true)
      const result = await deleteUser(id)
      if (result.success) {
        setUsers(prev => prev.filter(user => user.id !== id))
        toast({
          title: "Success",
          description: "User deleted successfully"
        })
      } else {
        throw new Error(result.error || 'Failed to delete user')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage system users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <UserTableContent
                  users={filteredUsers}
                  isLoading={isLoading}
                  onDelete={handleDelete}
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
