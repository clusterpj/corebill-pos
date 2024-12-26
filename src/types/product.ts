// src/types/product.ts
import { Section } from '@/services/api/section-api'

export interface Product {
  id: number
  name: string
  sku: string
  barcode?: string
  description?: string
  price: number
  cost_price?: number
  tax_rate: number
  category_id: number
  stock_level: number
  reorder_level?: number
  status: 'active' | 'inactive'
  attributes?: Record<string, any>
  
  // Section related fields
  section_id?: number
  section?: Section
  section_type?: 'kitchen' | 'bar' | 'other'
  section_name?: string
}

export interface ProductCategory {
  id: number
  name: string
  description?: string
  parent_id?: number
  status: 'active' | 'inactive'
}