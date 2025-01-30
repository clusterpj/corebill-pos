import { logger } from '../../../utils/logger'
import { v4 as uuidv4 } from 'uuid'
import { PaidStatus, OrderType } from '@/types/enums'

/**
 * Validates a hold order structure and its data
 */
export const validateHoldOrder = (order) => {
  if (!order || !order.id) {
    throw new Error('Invalid hold order data')
  }
  if (order.status === 'inactive') {
    throw new Error('Hold order is not active')
  }
  if (!order.hold_items || !order.hold_items.length) {
    throw new Error('Hold order has no items')
  }

  // Set default values for backwards compatibility
  if (!order.paid_status) {
    order.paid_status = PaidStatus.UNPAID
    logger.debug('Setting default paid_status:', order.paid_status)
  }

  if (!order.type) {
    order.type = OrderType.DINE_IN
    logger.debug('Setting default type:', order.type)
  }

  // Validate paid_status if present
  if (order.paid_status && !Object.values(PaidStatus).includes(order.paid_status)) {
    throw new Error('Invalid paid status. Must be either PAID or UNPAID')
  }

  // Validate order type if present
  if (order.type && !Object.values(OrderType).includes(order.type)) {
    throw new Error('Invalid order type. Must be one of: DINE IN, TO-GO, DELIVERY, PICKUP')
  }

  // Validate total matches items
  const calculatedTotal = order.hold_items.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity))
  }, 0)
  if (calculatedTotal !== order.total) {
    throw new Error('Hold order total mismatch')
  }
}

/**
 * Transforms API response data to include required parameters
 */
export const transformHoldInvoiceResponse = (data) => {
  if (!data) return data

  // Handle paginated response
  if (data.hold_invoices?.data) {
    data.hold_invoices.data = data.hold_invoices.data.map(invoice => ({
      ...invoice,
      paid_status: invoice.paid_status || PaidStatus.UNPAID,
      type: invoice.type || OrderType.DINE_IN
    }))
    return data
  }

  // Handle single invoice response
  if (data.id) {
    return {
      ...data,
      paid_status: data.paid_status || PaidStatus.UNPAID,
      type: data.type || OrderType.DINE_IN
    }
  }

  if (Array.isArray(data.taxes)) {
    logger.debug('Processing tax array:', data.taxes)
    data.taxes = data.taxes.map(tax => {
      logger.debug('Validating tax item:', tax)
      const validatedTax = validateTaxData(tax)
      logger.debug('Validated tax result:', validatedTax)
      return validatedTax
    })
    logger.debug('Final validated taxes:', data.taxes)
  }

  return data
}

/**
 * Generates a unique idempotency key for API requests
 */
export const generateIdempotencyKey = () => {
  return `pos_${Date.now()}_${uuidv4()}`
}

/**
 * Standardized API error handler
 */
export const handleApiError = (error) => {
  const errorResponse = {
    success: false,
    message: error.message,
    errors: {}
  }

  if (error.response) {
    switch (error.response.status) {
      case 400:
        errorResponse.message = 'Invalid request parameters'
        break
      case 401:
        errorResponse.message = 'Authentication required'
        break
      case 404:
        errorResponse.message = 'Resource not found'
        break
      case 422:
        errorResponse.message = 'Validation failed'
        errorResponse.errors = error.response.data.errors || {}
        break
      case 500:
        errorResponse.message = 'Internal server error'
        break
      default:
        errorResponse.message = 'An unexpected error occurred'
    }
    errorResponse.statusCode = error.response.status
  }

  logger.error('API Error:', {
    message: errorResponse.message,
    status: error.response?.status,
    errors: errorResponse.errors,
    originalError: error.message
  })

  throw errorResponse
}

/**
 * Validates tax data structure and its data
 */
export const validateTaxData = (tax) => {
  if (!tax.tax_type_id || !tax.company_id) {
    throw new Error('Missing required tax fields: tax_type_id or company_id')
  }
  return {
    tax_type_id: Number(tax.tax_type_id),
    company_id: Number(tax.company_id),
    amount: Number(tax.amount || 0),
    percent: Number(tax.percent || 0),
    compound_tax: Number(tax.compound_tax || 0),
    estimate_id: tax.estimate_id || null,
    invoice_item_id: tax.invoice_item_id || null,
    estimate_item_id: tax.estimate_item_id || null,
    item_id: tax.item_id || null,
    name: tax.name || ''
  }
}
