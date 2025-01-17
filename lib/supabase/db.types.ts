import type { Database } from '@/types/supabase'

type DbTables = Database['public']['Tables']
type ProductTable = DbTables['products']
type OrderTable = DbTables['orders']
type OrderItemTable = DbTables['order_items']

export type Product = ProductTable['Row']
export type DbProductInsert = ProductTable['Insert']
export type DbProductUpdate = ProductTable['Update']

export type DbOrder = OrderTable['Row']
export type DbOrderInsert = OrderTable['Insert']
export type DbOrderUpdate = OrderTable['Update']

export type DbOrderItem = OrderItemTable['Row']
export type DbOrderItemInsert = OrderItemTable['Insert']
export type DbOrderItemUpdate = OrderItemTable['Update']
