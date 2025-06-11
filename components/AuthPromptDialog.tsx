"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  LogIn, 
  UserPlus, 
  Package,
  Shield,
  Star,
  Truck
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AuthPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthPromptDialog({ isOpen, onClose }: AuthPromptDialogProps) {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/auth/login');
    onClose();
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-green-50 to-orange-50 p-6">
          <DialogHeader className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Track Your Orders
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Sign in to view your order history and track deliveries in real-time
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Benefits Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-center">Why Create an Account?</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Track all your orders in real-time</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Save your favorite products & addresses</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Secure account & order history</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Sign In Button - Primary */}
            <Card className="border-green-200 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer" onClick={handleSignIn}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogIn className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">Already have an account?</h4>
                      <p className="text-sm text-green-700">Sign in to track your orders</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSignIn();
                    }}
                  >
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sign Up Button - Secondary */}
            <Card className="border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer" onClick={handleSignUp}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-orange-900">New to Betty Organic?</h4>
                      <p className="text-sm text-orange-700">Create account in 30 seconds</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSignUp();
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Guest Option */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-3">
              Don't have an order yet?
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
            >
              Continue Browsing Products
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}