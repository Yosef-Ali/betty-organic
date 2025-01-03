import type { Database } from './database.types'

export type { Database }

// Database table types
export type Tables = Database['public']['Tables']

// Row types (database schema)
export type DbProduct = Tables['products']['Row']
export type DbOrder = Tables['orders']['Row']
export type DbOrderItem = Tables['order_item']['Row']
export type DbCustomer = Tables['customers']['Row']

// Mutation types
export type DbProductInsert = Tables['products']['Insert']
export type DbOrderInsert = Tables['orders']['Insert']
export type DbOrderItemInsert = Tables['order_item']['Insert']
export type DbCustomerInsert = Tables['customers']['Insert']
export type DbProductUpdate = Tables['products']['Update']
export type DbOrderUpdate = Tables['orders']['Update']
export type DbOrderItemUpdate = Tables['order_item']['Update']
export type DbCustomerUpdate = Tables['customers']['Update']

// Constants
export const ORDER_TYPES = ['online', 'in-store', 'phone'] as const
export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const
export const CUSTOMER_STATUSES = ['active', 'inactive'] as const

// Shared types
export type OrderType = typeof ORDER_TYPES[number]
export type OrderStatus = typeof ORDER_STATUSES[number]
export type CustomerStatus = typeof CUSTOMER_STATUSES[number]

// Application types
export type Product = DbProduct & { totalSales: number }
