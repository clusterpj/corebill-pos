import { Product } from './product'
import { User } from './user'

export enum InvoiceStatus {
  PENDING = 'PENDING',
  GENERATED = 'GENERATED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum PaidStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID'
}

export enum OrderType {
  DINE_IN = 'DINE IN',
  TO_GO = 'TO-GO',
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP'
}

export interface Order {
  id?: number
  user_id?: number
  total: number
  subtotal: number
  tax: number
  discount?: number
  products: Product[]
  status: string
  type: OrderType
  paid_status: PaidStatus
  notes?: string
  created_at?: Date
  updated_at?: Date
  
  // New invoice-related fields
  invoice_number?: string
  invoice_status?: InvoiceStatus
  invoice_generated_at?: Date
  send_sms?: number // 0 or 1 for SMS sending flag
}

export interface InvoiceGenerationRequest {
  orderId: number
  userId: number
}

export interface InvoiceResponse {
  order: Order
  invoice_number: string
  status: InvoiceStatus
}
