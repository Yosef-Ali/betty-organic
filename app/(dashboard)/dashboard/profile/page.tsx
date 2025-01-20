'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuthContext } from '@/contexts/auth/AuthContext'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { PackageOpen, Package, ChevronRight } from "lucide-react"
import { updateProfile } from '@/app/actions/userActions'
import { getOrders } from '@/app/actions/orderActions'
import { Database } from '@/types/supabase'

// Profile Page and Order History
export default function ProfilePage() {
  const { profile, loading } = useAuthContext()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState('')
  const [message, setMessage] = useState('')
  type Order = Database['public']['Tables']['orders']['Row'] & {
    order_items: Array<
      Database['public']['Tables']['order_items']['Row'] & {
        products: Database['public']['Tables']['products']['Row']
      }
    >
  }

  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setEmail(profile.email || '')
      setImage(profile.avatar_url || '')
      fetchOrders()
    }
  }, [profile])

  const fetchOrders = async () => {
    if (!profile) return
    setLoadingOrders(true)
    try {
      const orders = await getOrders(profile.id)
      setOrders(orders || [])
    } catch (error) {
      console.error('Error in fetchOrders:', error)
      setMessage('Failed to load orders')
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

  if (!profile) {
    return <div className="text-center mt-8">Please sign in to view your profile.</div>
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
            <p className="text-muted-foreground">Manage your account settings and view order history</p>
          </div>
        </div>
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="w-[400px]">
            <TabsTrigger value="orders" className="w-1/2">Order History</TabsTrigger>
            <TabsTrigger value="profile" className="w-1/2">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback className="text-4xl">
                      {name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setImage('')}>
                      Remove
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const url = prompt('Enter image URL:')
                      if (url) setImage(url)
                    }}>
                      Change
                    </Button>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
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
                      <Label htmlFor="email">Email Address</Label>
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
                  </div>
                  <div className="space-y-2">
                    <Label>Profile Image</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="image"
                        name="image"
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Enter image URL"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">
                      Save Changes
                    </Button>
                  </div>
                </form>
                {message && (
                  <div className={`mt-4 p-4 rounded-md ${message.includes('success')
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                    }`}>
                    <p className="text-sm">{message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  View and manage your recent orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : message ? (
                  <div className="p-4 bg-red-50 text-red-600 rounded-md">
                    <p className="text-sm">{message}</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <PackageOpen className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.created_at && new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">Order Items:</p>
                            <ul className="list-disc list-inside">
                              {order.order_items.map((item: Database['public']['Tables']['order_items']['Row'] & {
                                products: Database['public']['Tables']['products']['Row']
                              }, index: number) => (
                                <li key={index}>
                                  {item.products.name} - Quantity: {item.quantity} - Price: ${item.price.toFixed(2)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">${order.total_amount.toFixed(2)}</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-green-500' :
                                order.status === 'pending' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`} />
                              <p className="text-sm text-muted-foreground capitalize">
                                {order.status}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
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
