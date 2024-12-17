import { logger } from '../../../../../utils/logger'
import { OrderType, PaidStatus } from '../../../../../types/order'

// Validate invoice data before API call
export const validateInvoiceData = (data) => {
  logger.debug('Validating invoice data:', data)
  
  const requiredFields = [
    'invoice_number',
    'invoice_date',
    'due_date',
    'total',
    'sub_total',
    'items',
    'user_id',
    'type',
    'paid_status'
  ]

  const missingFields = requiredFields.filter(field => !data[field])
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Invoice must have at least one item')
  }

  // Validate items
  data.items.forEach((item, index) => {
    if (!item.item_id || !item.name || !item.price || !item.quantity) {
      throw new Error(`Invalid item data at index ${index}`)
    }
  })

  // Validate type
  if (!Object.values(OrderType).includes(data.type)) {
    throw new Error(`Invalid order type: ${data.type}. Must be one of: ${Object.values(OrderType).join(', ')}`)
  }

  // Validate paid_status
  if (!Object.values(PaidStatus).includes(data.paid_status)) {
    throw new Error(`Invalid paid status: ${data.paid_status}. Must be either PAID or UNPAID`)
  }

  logger.debug('Invoice data validation passed')
  return true
}

// Validate invoice for conversion
export const validateInvoiceForConversion = (invoice) => {
  if (!invoice?.id && !invoice?.hold_invoice_id) {
    logger.error('Invalid invoice - missing ID fields:', invoice)
    throw new Error('Invalid invoice: missing ID fields')
  }

  // Ensure we have items array
  const items = invoice.hold_items || invoice.items
  if (!Array.isArray(items) || items.length === 0) {
    logger.error('Invalid invoice - no items found:', {
      hasHoldItems: !!invoice.hold_items,
      hasItems: !!invoice.items,
      itemsLength: items?.length
    })
    throw new Error('No items found in invoice')
  }

  // Validate each item
  items.forEach((item, index) => {
    if (!item.item_id || !item.name) {
      logger.error('Invalid item data at index:', { index, item })
      throw new Error(`Invalid item data at index ${index}: missing required fields`)
    }
  })

  invoice.hold_items.forEach((item, index) => {
    if (!item.item_id || !item.name) {
      throw new Error(`Invalid item data at index ${index}: missing required fields`)
    }
  })

  // Validate type
  if (!Object.values(OrderType).includes(invoice.type)) {
    throw new Error(`Invalid order type: ${invoice.type}. Must be one of: ${Object.values(OrderType).join(', ')}`)
  }

  // Validate paid_status if present
  if (invoice.paid_status && !Object.values(PaidStatus).includes(invoice.paid_status)) {
    throw new Error(`Invalid paid status: ${invoice.paid_status}. Must be either PAID or UNPAID`)
  }

  return true
}
