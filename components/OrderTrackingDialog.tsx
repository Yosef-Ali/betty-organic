"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Package, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  MapPin,
  Phone,
  Calendar,
  RefreshCw,
  ChevronRight,
  History,
  Eye
} from "lucide-react";
import { getOrderDetails, getRecentOrders } from "@/app/actions/orderActions";
import { cn } from "@/lib/utils";

interface OrderTrackingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderSummary {
  id: string;
  display_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  total_amount: number;
  customer?: {
    name: string;
    phone?: string;
  };
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
}

export default function OrderTrackingDialog({ isOpen, onClose }: OrderTrackingDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("recent");

  // Fetch recent orders on dialog open
  useEffect(() => {
    if (isOpen) {
      fetchRecentOrders();
    }
  }, [isOpen]);

  const fetchRecentOrders = async () => {
    setIsLoadingRecent(true);
    setError(null);
    
    try {
      const { data, error: ordersError } = await getRecentOrders(10);
      
      if (ordersError || !data) {
        setError("Unable to load recent orders");
        setRecentOrders([]);
      } else {
        const mappedOrders: OrderSummary[] = data.map(order => ({
          id: order.id,
          display_id: order.display_id || '',
          status: order.status,
          created_at: order.created_at || '',
          updated_at: order.updated_at || '',
          total_amount: order.total_amount,
          customer: order.customer,
          items: order.items || []
        }));
        setRecentOrders(mappedOrders);
      }
    } catch (err) {
      setError("Failed to fetch recent orders");
      setRecentOrders([]);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const searchOrder = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter an order number");
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const { data, error: orderError } = await getOrderDetails(searchQuery);
      
      if (orderError || !data) {
        setError("Order not found. Please check your order number.");
        setSelectedOrder(null);
      } else {
        const mappedOrder: OrderSummary = {
          id: data.id,
          display_id: data.display_id || '',
          status: data.status,
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
          total_amount: data.total_amount,
          customer: data.customer,
          items: data.items || []
        };
        setSelectedOrder(mappedOrder);
        setActiveTab("details");
      }
    } catch (err) {
      setError("Failed to fetch order details. Please try again.");
      setSelectedOrder(null);
    } finally {
      setIsSearching(false);
    }
  };

  const selectOrder = (order: OrderSummary) => {
    setSelectedOrder(order);
    setActiveTab("details");
  };

  const getTrackingSteps = (status: string, createdAt: string, updatedAt?: string): TrackingStep[] => {
    const baseSteps: Omit<TrackingStep, 'status' | 'timestamp'>[] = [
      {
        id: 'pending',
        title: 'Order Placed',
        description: 'Your order has been received',
        icon: <Package className="w-4 h-4" />
      },
      {
        id: 'processing',
        title: 'Preparing',
        description: 'Fresh produce being packed',
        icon: <Clock className="w-4 h-4" />
      },
      {
        id: 'completed',
        title: 'Delivered',
        description: 'Order delivered successfully',
        icon: <CheckCircle className="w-4 h-4" />
      }
    ];

    return baseSteps.map((step) => {
      let stepStatus: 'completed' | 'current' | 'pending' = 'pending';
      let timestamp: string | undefined;

      if (status === 'pending' && step.id === 'pending') {
        stepStatus = 'current';
        timestamp = createdAt;
      } else if (status === 'processing') {
        if (step.id === 'pending') {
          stepStatus = 'completed';
          timestamp = createdAt;
        } else if (step.id === 'processing') {
          stepStatus = 'current';
          timestamp = updatedAt;
        }
      } else if (status === 'completed') {
        if (step.id === 'completed') {
          stepStatus = 'current';
          timestamp = updatedAt;
        } else {
          stepStatus = 'completed';
          timestamp = step.id === 'pending' ? createdAt : updatedAt;
        }
      }

      return { ...step, status: stepStatus, timestamp };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedOrder(null);
    setError(null);
    setActiveTab("recent");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 sm:p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5 text-green-600" />
            Track Your Orders
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <div className="px-4 sm:px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Recent Orders</span>
                <span className="sm:hidden">Recent</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search Order</span>
                <span className="sm:hidden">Search</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="recent" className="mt-4 h-full overflow-hidden">
              <div className="px-4 sm:px-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Recent Orders</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={fetchRecentOrders}
                    disabled={isLoadingRecent}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoadingRecent && "animate-spin")} />
                  </Button>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4 border border-red-200">
                    {error}
                  </div>
                )}

                <ScrollArea className="h-[400px] sm:h-[500px]">
                  {isLoadingRecent ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg animate-pulse">
                          <div className="flex justify-between items-start mb-2">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-5 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm font-medium mb-2">No recent orders found</p>
                      <p className="text-xs text-gray-500 mb-4">
                        Your orders will appear here once you place them
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                          // Close the dialog after scrolling
                          setTimeout(() => onClose(), 300);
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        Browse Products
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <Card 
                          key={order.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => selectOrder(order)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-sm">#{order.display_id}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={cn("text-xs border", getStatusColor(order.status))}>
                                  {order.status}
                                </Badge>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                {order.items.length} items
                              </span>
                              <span className="font-medium text-green-600">
                                Br {order.total_amount.toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-4 h-full overflow-hidden">
              <div className="px-4 sm:px-6 h-full">
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter order number (e.g., ORD-123456)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={searchOrder} 
                        disabled={isSearching}
                        className="bg-green-600 hover:bg-green-700 px-4"
                      >
                        {isSearching ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                      {error}
                    </div>
                  )}
                </div>

                {selectedOrder && (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("details")}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Order Details
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-4 h-full overflow-hidden">
              {selectedOrder && (
                <div className="px-4 sm:px-6 h-full">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {/* Order Summary */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">#{selectedOrder.display_id}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(selectedOrder.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={cn("border", getStatusColor(selectedOrder.status))}>
                              {selectedOrder.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Customer</p>
                              <p className="font-medium">{selectedOrder.customer?.name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-semibold text-green-600">
                                Br {selectedOrder.total_amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Timeline */}
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-4">Order Progress</h3>
                          
                          <div className="space-y-4">
                            {getTrackingSteps(selectedOrder.status, selectedOrder.created_at, selectedOrder.updated_at).map((step, index, array) => (
                              <div key={step.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                                    step.status === 'completed' 
                                      ? "bg-green-100 border-green-500 text-green-600" 
                                      : step.status === 'current'
                                      ? "bg-blue-100 border-blue-500 text-blue-600"
                                      : "bg-gray-100 border-gray-300 text-gray-400"
                                  )}>
                                    {step.icon}
                                  </div>
                                  {index < array.length - 1 && (
                                    <div className={cn(
                                      "w-0.5 h-8 mt-2",
                                      step.status === 'completed' ? "bg-green-500" : "bg-gray-200"
                                    )} />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                    <h4 className={cn(
                                      "font-medium text-sm",
                                      step.status === 'current' ? "text-blue-600" : ""
                                    )}>
                                      {step.title}
                                    </h4>
                                    {step.timestamp && (
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(step.timestamp).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {step.description}
                                  </p>
                                  
                                  {step.status === 'current' && (
                                    <div className="mt-2">
                                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                                        In Progress
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Items */}
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-3">Items ({selectedOrder.items.length})</h3>
                          <div className="space-y-2">
                            {selectedOrder.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium">{item.product_name}</span>
                                  <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                                </div>
                                <span className="text-green-600 font-medium">
                                  Br {item.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}