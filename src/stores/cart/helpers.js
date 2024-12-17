import { useCompanyStore } from '../company'
import { logger } from '../../utils/logger'

import { PriceUtils } from '@/utils/price'

export const priceHelpers = {
  toCents: (amount) => {
    logger.info('priceHelpers.toCents:', { amount })
    return PriceUtils.toCents(amount)
  },
  
  toDollars: (amount) => {
    logger.info('priceHelpers.toDollars:', { amount })
    return Number(PriceUtils.toDollars(amount))
  },
  
  normalizePrice: (price) => {
    logger.info('priceHelpers.normalizePrice:', { price })
    return PriceUtils.isInDollars(price) ? 
      PriceUtils.normalizePrice(price) : 
      price
  }
}

export const prepareItemsForApi = (items) => {
  const companyStore = useCompanyStore()
  
  return items.map(item => {
    // Ensure price is in cents
    const itemPrice = priceHelpers.normalizePrice(item.price)
    const itemQuantity = parseInt(item.quantity)
    const itemTotal = itemPrice * itemQuantity
    
    logger.info('Preparing item for API:', {
      id: item.id,
      name: item.name,
      originalPrice: item.price,
      normalizedPrice: itemPrice,
      quantity: itemQuantity,
      total: itemTotal
    })
    
    return {
      item_id: Number(item.id),
      name: item.name,
      description: item.description || null,
      price: itemPrice,
      quantity: itemQuantity,
      unit_name: item.unit_name || 'units',
      sub_total: itemTotal,
      total: itemTotal,
      discount: "0",
      discount_val: 0,
      discount_type: "fixed",
      tax: priceHelpers.normalizePrice(item.tax || 0),
      company_id: Number(companyStore.company?.id) || 1,
      retention_amount: 0,
      retention_concept: 'NO_RETENTION',
      retention_percentage: 0
    }
  })
}

export const parseOrderNotes = (notes) => {
  try {
    const notesObj = JSON.parse(notes)
    return notesObj.customerNotes || ''
  } catch (e) {
    // If notes is a plain string, return it as is
    return typeof notes === 'string' ? notes : ''
  }
}

export const getCurrentDate = () => new Date().toISOString().split('T')[0]

export const getDueDate = (daysFromNow = 7) => {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
}
