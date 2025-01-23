/**
 * Centralized enums for the application
 */

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

export enum PaidStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID'
}

export enum SectionType {
  KITCHEN = 'kitchen',
  BAR = 'bar',
  OTHER = 'other'
}
