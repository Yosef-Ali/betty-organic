'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import type { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateProfile } from '@/app/actions/userActions'
import { createClient } from '@/lib/supabase/client'
import type { Customer } from '@/lib/supabase/types'

export default function ProfilePage() {
  const { user, session } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState('')
  const [message, setMessage] = useState('')
  interface Order {
    created_at: string | null
    customer_id: string
    id: string
    status: string
    total_amount: number
    type: string
    updated_at: string | null
    customerInfo: string
    orderNumber: string
  }

  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || '')
      setEmail(user.email || '')
      setImage(user.user_metadata?.avatar_url || '')
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return
    setLoadingOrders(true)
    let customer
    try {
      const supabase = createClient()
      if (!session) {
        throw new Error('No active session')
      }

      if (!session?.user?.email) {
        throw new Error('No email found in session')
      }

      // Check if customer exists, create if not
      let { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (!customerData) {
        // Create new customer profile
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert<Customer>({
            email: session.user.email,
            full_name: user.user_metadata?.full_name || '',
            created_at: new Date().toISOString(),
            status: 'active',
            image_url: user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString(),
            id: '', // Will be auto-generated
            phone: null,
            location: null
          })
          .select('id')
          .single()

        if (!newCustomer) {
          throw new Error('Failed to create customer profile')
        }
        customerData = newCustomer
      }

      customer = customerData

      // Validate orders table exists by attempting to select
      const { error: tableCheckError } = await supabase
        .from('orders')
        .select('id')
        .limit(1)

      if (tableCheckError?.code === '42P01') { // 42P01 = undefined_table error code
        throw new Error('Orders table not found in database')
      }

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(ordersData as Order[] || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching orders:', errorMessage);

      // Set an error message to display to the user
      setMessage(`Failed to fetch orders: ${errorMessage}`);
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      const result = await updateProfile({
        name,
        email,
        image
      })

      if (result.success) {
        setMessage('Profile updated successfully')
      } else {
        setMessage(result.error || 'Failed to update profile')
      }
    } catch (error) {
      setMessage('An error occurred while updating the profile')
    }
  }

  if (!user) {
    return <div className="text-center mt-8">Please sign in to view your profile.</div>
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        </div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback>{name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Profile Image URL</Label>
                    <Input
                      id="image"
                      name="image"
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Update Profile
                  </Button>
                </form>
                {message && (
                  <p className={`mt-4 text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  View your past orders and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                ) : message ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">{message}</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Order #{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.created_at && new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="px-2 py-1 rounded-full text-sm bg-primary/10 text-primary">
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            Total Amount: ${order.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
