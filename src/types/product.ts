// src/types/product.ts
import { Section } from '@/services/api/section-api'
import type { Ref } from 'vue'

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
  section_id?: number | null
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
  item_category_id?: number // Added to match actual usage
}

export interface ProductsState {
  products: Ref<Product[]>
  categories: Ref<ProductCategory[]>
  totalItems: Ref<number>
  loading: Ref<{
    categories: boolean
    products: boolean
    itemOperation: boolean
  }>
  error: Ref<string | null>
  selectedCategory: Ref<string | number>
  searchQuery: Ref<string>
  currentPage: Ref<number>
  itemsPerPage: Ref<number>
  sectionsMap: Record<number, Section>
}
