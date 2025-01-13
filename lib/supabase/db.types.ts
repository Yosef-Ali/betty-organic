import type { Database } from '@/types/supabase'

type DbTables = Database['public']['Tables']
type ProductTable = DbTables['products']

export type Product = ProductTable['Row']
export type DbProductInsert = ProductTable['Insert']
export type DbProductUpdate = ProductTable['Update']
