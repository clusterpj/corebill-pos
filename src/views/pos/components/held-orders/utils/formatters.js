import { OrderType } from '@/types/enums'

// Format date for API (YYYY-MM-DD)
export const formatApiDate = (date) => {
  return date.toISOString().split('T')[0]
}

// Format date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

// Format currency
export const formatCurrency = (amount) => PriceUtils.format(amount)

import { PriceUtils } from '@/utils/price'

// Convert decimal to cents (biginteger)
export const toCents = (amount) => PriceUtils.toCents(amount)

// Convert cents to dollars
export const toDollars = (amount) => Number(PriceUtils.toDollars(amount))

// Get order type from invoice
export const getOrderType = (invoice) => {
  // Use the type field directly
  if (invoice.type && Object.values(OrderType).includes(invoice.type)) {
    return invoice.type
  }
  return OrderType.DINE_IN // Default to DINE IN if no type is set
}

// Get color for order type chip
export const getOrderTypeColor = (type) => {
  const colors = {
    [OrderType.DINE_IN]: 'primary',
    [OrderType.TO_GO]: 'success',
    [OrderType.DELIVERY]: 'warning',
    [OrderType.PICKUP]: 'info'
  }
  return colors[type] || 'grey'
}
