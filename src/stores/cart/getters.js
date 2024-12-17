// src/stores/cart/getters.js
import { OrderType } from '../../types/order'
import { PriceUtils } from '@/utils/price'

export const getters = {
  subtotal: (state) => {
    return state.items.reduce((sum, item) => {
      const itemPrice = PriceUtils.normalizePrice(item.price)
      const itemTotal = itemPrice * item.quantity
      return sum + itemTotal
    }, 0)
  },

  discountAmount: (state) => {
    if (state.discountType === '%') {
      return Math.round(state.items.reduce((sum, item) => {
        const itemPrice = PriceUtils.normalizePrice(item.price)
        return sum + (itemPrice * item.quantity)
      }, 0) * (state.discountValue / 100))
    }
    return PriceUtils.toCents(state.discountValue)
  },

  taxableAmount: (state) => {
    const subtotal = state.items.reduce((sum, item) => {
      const itemPrice = PriceUtils.normalizePrice(item.price)
      return sum + (itemPrice * item.quantity)
    }, 0)
    
    const discount = state.discountType === '%' 
      ? Math.round(subtotal * (state.discountValue / 100))
      : PriceUtils.toCents(state.discountValue)
    
    return subtotal - discount
  },

  taxAmount: (state) => {
    // Use the taxableAmount getter to get the amount after discount
    const taxableAmount = getters.taxableAmount(state)
    
    // Use tax rate directly since it's already in decimal form (0.08 = 8%)
    return Math.round(taxableAmount * state.taxRate)
  },

  total: (state) => {
    const subtotal = state.items.reduce((sum, item) => {
      const itemPrice = PriceUtils.normalizePrice(item.price)
      return sum + (itemPrice * item.quantity)
    }, 0)
    
    const discount = state.discountType === '%' 
      ? Math.round(subtotal * (state.discountValue / 100))
      : PriceUtils.toCents(state.discountValue)
    
    const taxableAmount = subtotal - discount
    // Use tax rate directly since it's already in decimal form
    const taxAmount = Math.round(taxableAmount * state.taxRate)
    
    return Math.round(taxableAmount + taxAmount)
  },

  itemCount: (state) => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0)
  },

  isEmpty: (state) => {
    return state.items.length === 0
  },

  isHoldOrder: (state) => {
    return state.holdInvoiceId !== null
  },

  orderType: (state) => {
    return state.type || null
  },

  isValidOrderType: (state) => {
    return state.type && Object.values(OrderType).includes(state.type)
  },

  isEditingInvoice: (state) => {
    return state.editingInvoiceId !== null
  },

  canUpdateInvoice: (state) => {
    return state.editingInvoiceId !== null && 
           ['DRAFT', 'SENT'].includes(state.editingInvoiceStatus)
  }
}