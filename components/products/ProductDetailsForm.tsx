'use client'

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { UseFormReturn } from "react-hook-form"
import { ProductFormValues } from "./ProductFormSchema"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductCategory } from '@/types/supabase';
import { Badge } from "@/components/ui/badge"
import { Banknote, Package, Tag } from "lucide-react"

const PRODUCT_CATEGORIES: ProductCategory[] = [
  "All",
  "Spices_Oil_Tuna",
  "Flowers",
  "Vegetables",
  "Fruits",
  "Herbs_Lettuce",
  "Dry_Stocks_Bakery",
  "Eggs_Dairy_products"
];

const CATEGORY_DESCRIPTIONS: Record<ProductCategory, string> = {
  "All": "General products without specific categorization",
  "Spices_Oil_Tuna": "Cooking essentials, oils, and preserved fish",
  "Flowers": "Fresh flowers and floral arrangements",
  "Vegetables": "Fresh organic vegetables",
  "Fruits": "Fresh organic fruits",
  "Herbs_Lettuce": "Fresh herbs and leafy greens",
  "Dry_Stocks_Bakery": "Dry goods, stocks, and baked items",
  "Eggs_Dairy_products": "Fresh eggs and dairy products"
};

interface ProductDetailsFormProps {
  form: UseFormReturn<ProductFormValues>
}

export function ProductDetailsForm({ form }: ProductDetailsFormProps) {
  const watchedPrice = form.watch('price');
  const watchedStock = form.watch('stock');
  const watchedCategory = form.watch('category');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Product Details
        </CardTitle>
        <CardDescription>
          Enter the essential information about your product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selection */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full text-left justify-start px-3 py-2 h-auto min-h-[40px]">
                    <SelectValue placeholder="Select a category" className="text-left" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent align="start" className="w-full">
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem 
                      key={category} 
                      value={category}
                      className="px-3 py-3 cursor-pointer hover:bg-muted focus:bg-muted"
                    >
                      <div className="flex flex-col items-start text-left w-full">
                        <span className="font-medium">{category.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-muted-foreground mt-1 leading-tight">
                          {CATEGORY_DESCRIPTIONS[category]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {watchedCategory && (
                <FormDescription className="text-sm">
                  {CATEGORY_DESCRIPTIONS[watchedCategory as ProductCategory]}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Product Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter product name (e.g., Organic Tomatoes)" 
                  {...field}
                  className="text-base"
                  maxLength={100}
                />
              </FormControl>
              <FormDescription>
                Choose a clear, descriptive name that customers will easily recognize
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your product's features, benefits, and origin..."
                  className="min-h-[120px] text-base resize-none"
                  maxLength={500}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide details about quality, origin, and what makes this product special
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price and Stock Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Field */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Price (ETB)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00 ETB"
                      step="0.01"
                      min="0"
                      max="10000"
                      className="pl-10 text-base"
                      {...field}
                      onChange={e => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        field.onChange(value)
                      }}
                      onBlur={() => form.trigger('price')}
                    />
                  </div>
                </FormControl>
                {watchedPrice > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {watchedPrice.toFixed(2)} ETB
                    </Badge>
                    {watchedPrice > 100 && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        High-value item
                      </Badge>
                    )}
                  </div>
                )}
                <FormDescription>
                  Set competitive pricing in Ethiopian Birr (ETB) for your organic products
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock Field */}
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock Quantity
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="1000"
                      className="pl-10 text-base"
                      {...field}
                      onChange={e => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                        field.onChange(value)
                      }}
                      onBlur={() => form.trigger('stock')}
                    />
                  </div>
                </FormControl>
                {watchedStock > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={watchedStock < 10 ? "destructive" : watchedStock < 50 ? "secondary" : "default"} 
                      className="text-xs"
                    >
                      {watchedStock} units
                    </Badge>
                    {watchedStock < 10 && (
                      <Badge variant="outline" className="text-xs text-red-600">
                        Low stock
                      </Badge>
                    )}
                  </div>
                )}
                <FormDescription>
                  Current inventory count for this product
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category-specific warnings */}
        {watchedCategory === 'Eggs_Dairy_products' && watchedStock > 100 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>High stock warning:</strong> Dairy products have shorter shelf life. Consider reducing stock to under 100 units.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
