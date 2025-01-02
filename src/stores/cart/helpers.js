import { useCompanyStore } from '../company'
import { logger } from '../../utils/logger'

import { PriceUtils } from '@/utils/price'

export const priceHelpers = {
  toCents: (amount) => {
    logger.debug('priceHelpers.toCents input:', { 
      amount,
      type: typeof amount,
      isInteger: Number.isInteger(amount)
    })
    const cents = PriceUtils.toCents(amount)
    logger.debug('priceHelpers.toCents output:', { amount, cents })
    return cents
  },
  
  toDollars: (amount) => {
    logger.debug('priceHelpers.toDollars input:', { 
      amount,
      type: typeof amount,
      isInteger: Number.isInteger(amount)
    })
    const dollars = Number(PriceUtils.toDollars(amount))
    logger.debug('priceHelpers.toDollars output:', { amount, dollars })
    return dollars
  },
  
  normalizePrice: (price) => {
    logger.debug('priceHelpers.normalizePrice input:', { 
      price,
      type: typeof price,
      isInteger: Number.isInteger(price)
    })
    // Always ensure we're working with cents
    const cents = PriceUtils.isInDollars(price) ? 
      PriceUtils.toCents(price) : 
      price
    logger.debug('priceHelpers.normalizePrice output:', { price, cents })
    return cents
  }
}

export const prepareItemsForApi = (items) => {
  const companyStore = useCompanyStore()
  
  return items.map(item => {
    // Always convert price to cents if it's in dollars
    const itemPrice = PriceUtils.isInDollars(item.price) ? 
      PriceUtils.toCents(item.price) : 
      item.price
      
    const itemQuantity = parseInt(item.quantity)
    const itemTotal = itemPrice * itemQuantity
    
    logger.debug('Preparing item for API:', {
      id: item.id,
      name: item.name,
      originalPrice: item.price,
      priceInCents: itemPrice,
      quantity: itemQuantity,
      totalInCents: itemTotal,
      isDollarPrice: PriceUtils.isInDollars(item.price)
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
    if (!notes) return ''
    
    const notesObj = JSON.parse(notes)
    
    // Handle new format
    if (notesObj.customerNotes) {
      return notesObj.customerNotes
    }
    
    // Handle old format
    if (notesObj.orderInfo?.customer?.notes) {
      return notesObj.orderInfo.customer.notes
    }
    
    // Handle old format with instructions
    if (notesObj.orderInfo?.customer?.instructions) {
      return notesObj.orderInfo.customer.instructions
    }
    
    // If notes is a plain string, return it as is
    return typeof notesObj === 'string' ? notesObj : ''
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
