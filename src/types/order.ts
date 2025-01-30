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

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PosStatus {
  PENDING = 'P',
  COMPLETED = 'C'
}

export interface Section {
  id: number
  name: string
  type: 'kitchen' | 'bar'
  items?: OrderItem[]
}

export interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
  section_id?: number
  section_type?: 'kitchen' | 'bar'
  section_name?: string
  pos_status?: PosStatus
  description?: string
}

export interface Order {                                                                  
  id?: number                                                                             
  user_id?: number                                                                        
  total: number                                                                           
  subtotal: number                                                                        
  tax: number                                                                             
  discount?: number                                                                       
  products: Product[]                                                                     
  status: OrderStatus | string                                                            
  type: OrderType                                                                         
  paid_status: PaidStatus                                                                 
  notes?: string                                                                          
  created_at?: Date | string                                                              
  updated_at?: Date | string                                                              
  completed_at?: Date | string                                                            
  items: OrderItem[]                                                                      
  sections?: Section[]                                                                    
  pos_status?: PosStatus                                                                  
                                                                                          
  // Tax details matching API response                                                    
  taxes?: Array<{                                                                         
    tax_type_id: number                                                                   
    estimate_id: number | null                                                            
    invoice_item_id: number | null                                                        
    estimate_item_id: number | null                                                       
    item_id: number | null                                                                
    company_id: number                                                                    
    name: string                                                                          
    amount: number                                                                        
    percent: number                                                                       
    compound_tax: number                                                                  
  }>                                                                                      
                                                                                          
  // Display fields                                                                       
  reference?: string                                                                      
  displayType?: string                                                                    
  description?: string                                                                    
                                                                                          
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

export interface OrderStatusChangeRequest {
  orderId: number
  type: 'HOLD' | 'INVOICE'
  pos_status: PosStatus
}

export interface OrderItemStatusChangeRequest extends OrderStatusChangeRequest {
  itemId: number
}
