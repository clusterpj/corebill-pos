// src/types/common.ts
export interface BaseEntity {
    id: number
    created_at: string
    updated_at: string
    deleted_at?: string
  }
  
  export interface Address {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
    type?: 'billing' | 'shipping'
  }
  
  export interface Money {
    amount: number
    currency: string
  }
  
  export interface DateRange {
    start: string
    end: string
  }
  
  export interface Pagination {
    page: number
    per_page: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }