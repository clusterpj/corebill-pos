import { OrderType } from '@/types/order'

/**
 * Format time for display
 * @param {string} timestamp ISO timestamp
 * @returns {string} Formatted time
 */
export const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calculate elapsed time in minutes
 * @param {string} timestamp ISO timestamp
 * @returns {number} Minutes elapsed
 */
export const getElapsedTime = (timestamp) => {
  const start = new Date(timestamp)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
}

/**
 * Get color for order type chip
 * @param {string} type Order type
 * @returns {string} Color name
 */
export const getOrderTypeColor = (type) => {
  const colors = {
    'holdInvoice': 'primary',
    'invoice': 'secondary'
  }
  return colors[type] || 'default'
}

/**
 * Format order type for display
 * @param {string} type Order type
 * @returns {string} Formatted type
 */
export const formatOrderType = (type) => {
  const types = {
    'holdInvoice': 'Hold Order',
    'Invoice': 'Invoice'
  }
  return types[type] || type
}
