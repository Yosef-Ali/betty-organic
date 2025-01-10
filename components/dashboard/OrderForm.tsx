'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createOrder } from '@/app/actions/orderActions'

interface Product {
  id: string
  name: string
  price: number
}

interface OrderFormProps {
  products: Product[]
}

export function OrderForm({ products }: OrderFormProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [status, setStatus] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await createOrder({
        products: selectedProducts,
        status: 'pending',
        created_by: 'user_id' // Replace 'user_id' with actual user ID from your auth system
      })
      setStatus('Order created successfully!')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatus('Error creating order: ' + error.message)
      } else {
        setStatus('An unknown error occurred')
      }
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Create New Order</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4">
          {products.map(product => (
            <div key={product.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`product-${product.id}`}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProducts([...selectedProducts, product.id])
                  } else {
                    setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                  }
                }}
              />
              <Label htmlFor={`product-${product.id}`}>
                {product.name} - ${product.price}
              </Label>
            </div>
          ))}
        </div>
        <Button type="submit">Create Order</Button>
      </form>
      {status && <p className="text-sm">{status}</p>}
    </div>
  )
}
