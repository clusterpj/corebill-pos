// src/types/product.ts
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
  }
  
  export interface ProductCategory {
    id: number
    name: string
    description?: string
    parent_id?: number
    status: 'active' | 'inactive'
  }
  