import type {
  DbProduct,
  DbOrder,
  DbOrderItem,
  DbCustomer,
  OrderType,
  OrderStatus,
  CustomerStatus
} from '@/lib/supabase/db.types'

// Base Application Types
export type Product = DbProduct & {
  totalSales: number
}

export type Order = Omit<DbOrder, 'customer_id' | 'total_amount'> & {
  customerId: string
  totalAmount: number
  customer: Customer | null
  items: OrderItem[]
}

export type OrderItem = Omit<DbOrderItem, 'order_id' | 'product_id'> & {
  orderId: string
  productId: string
  product?: Product | null
}

export type Customer = Omit<DbCustomer, 'image_url'> & {
  imageUrl: string | null
}

// Re-export shared types
export type { OrderType, OrderStatus, CustomerStatus }
