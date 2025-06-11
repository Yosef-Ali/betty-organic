"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  MapPin,
  Phone,
  Calendar
} from "lucide-react";
import { getOrderDetails } from "@/app/actions/orderActions";
import { cn } from "@/lib/utils";

interface OrderTrackingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderTrackingData {
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
  const [orderNumber, setOrderNumber] = useState("");
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchOrder = async () => {
    if (!orderNumber.trim()) {
      setError("Please enter an order number");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: orderError } = await getOrderDetails(orderNumber);
      
      if (orderError || !data) {
        setError("Order not found. Please check your order number.");
        setOrderData(null);
      } else {
        setOrderData({
          id: data.id,
          display_id: data.display_id || '',
          status: data.status,
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
          total_amount: data.total_amount,
          customer: data.customer,
          items: data.items || []
        });
      }
    } catch (err) {
      setError("Failed to fetch order details. Please try again.");
      setOrderData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrackingSteps = (status: string, createdAt: string, updatedAt?: string): TrackingStep[] => {
    const baseSteps: Omit<TrackingStep, 'status' | 'timestamp'>[] = [
      {
        id: 'pending',
        title: 'Order Placed',
        description: 'Your order has been received and is being processed',
        icon: <Package className="w-4 h-4" />
      },
      {
        id: 'processing',
        title: 'Preparing Order',
        description: 'Your fresh produce is being carefully selected and packed',
        icon: <Clock className="w-4 h-4" />
      },
      {
        id: 'completed',
        title: 'Delivered',
        description: 'Your order has been delivered successfully',
        icon: <CheckCircle className="w-4 h-4" />
      }
    ];

    return baseSteps.map((step, index) => {
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

      return {
        ...step,
        status: stepStatus,
        timestamp
      };
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
    setOrderNumber("");
    setOrderData(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            Track Your Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="orderNumber"
                      placeholder="Enter your order number (e.g., ORD-123456)"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
                    />
                    <Button 
                      onClick={searchOrder} 
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                    {error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                Searching for your order...
              </div>
            </div>
          )}

          {/* Order Details */}
          {orderData && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Order #{orderData.display_id}</h3>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(orderData.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={cn("border", getStatusColor(orderData.status))}>
                      <span className="capitalize">{orderData.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Customer:</span>
                      <span>{orderData.customer?.name || 'N/A'}</span>
                    </div>
                    {orderData.customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{orderData.customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Items:</span>
                      <span>{orderData.items.length} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-semibold text-green-600">
                        Br {orderData.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Order Timeline</h3>
                  
                  <div className="space-y-4">
                    {getTrackingSteps(orderData.status, orderData.created_at, orderData.updated_at).map((step, index, array) => (
                      <div key={step.id} className="flex gap-4">
                        {/* Timeline Line & Icon */}
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
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
                              "w-0.5 h-12 mt-2 transition-all",
                              step.status === 'completed' ? "bg-green-500" : "bg-gray-200"
                            )} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-8">
                          <div className="flex items-center justify-between">
                            <h4 className={cn(
                              "font-medium",
                              step.status === 'current' ? "text-blue-600" : ""
                            )}>
                              {step.title}
                            </h4>
                            {step.timestamp && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(step.timestamp).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                          
                          {step.status === 'current' && (
                            <div className="mt-2">
                              <div className={cn(
                                "text-xs px-2 py-1 rounded-full inline-flex items-center gap-1",
                                step.status === 'current' && orderData.status === 'processing'
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              )}>
                                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                In Progress
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {orderData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                        </div>
                        <span className="text-green-600 font-medium">
                          Br {item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span className="text-green-600">Br {orderData.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}