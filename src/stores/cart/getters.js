// src/stores/cart/getters.js
import { OrderType } from '../../types/order'
import { PriceUtils } from '@/utils/price'

/**
 * @typedef {Object} CartState
 * @property {Array<{ id: string, price: number, quantity: number }>} items
 * @property {string} discountType
 * @property {number} discountValue
 * @property {number} taxRate
 * @property {string|null} type
 * @property {string|null} editingInvoiceId
 * @property {string|null} editingInvoiceStatus
 * @property {string|null} holdInvoiceId
 */

export const getters = {
  /** @param {CartState} state */
  subtotal: (state) => {
    return state.items.reduce((sum, item) => {
      const itemPrice = PriceUtils.normalizePrice(item.price)
      const itemTotal = itemPrice * item.quantity
      return sum + itemTotal
    }, 0)
  },

  /** @param {CartState} state */
  discountAmount: (state) => {
    if (state.discountType === '%') {
      return Math.round(state.items.reduce((sum, item) => {
        const itemPrice = PriceUtils.normalizePrice(item.price)
        return sum + (itemPrice * item.quantity)
      }, 0) * (Number(state.discountValue) / 100))
    }
    
    // For fixed discounts, handle integers under 100 as dollar amounts
    const discountValue = Number(state.discountValue) || 0
    if (Number.isInteger(discountValue) && discountValue > 0 && discountValue < 100) {
      return discountValue * 100 // Convert small whole numbers to cents directly
    }
    
    return PriceUtils.normalizePrice(state.discountValue)
  },

  /** @param {CartState} state */
  taxableAmount: (state) => {
    const subtotal = state.items.reduce((sum, item) => {
      const itemPrice = PriceUtils.normalizePrice(item.price)
      return sum + (itemPrice * item.quantity)
    }, 0)
    
    const discount = state.discountType === '%' 
      ? Math.round(subtotal * (Number(state.discountValue) / 100))
      : (() => {
          const discountValue = Number(state.discountValue) || 0
          if (Number.isInteger(discountValue) && discountValue > 0 && discountValue < 100) {
            return discountValue * 100
          }
          return PriceUtils.normalizePrice(state.discountValue)
        })()
    
    
    return subtotal - discount
  },

  /** @param {CartState} state */
  taxAmount: (state) => {
    // Use the taxableAmount getter to get the amount after discount
    const taxableAmount = getters.taxableAmount(state)
    
    // Use tax rate directly since it's already in decimal form (0.08 = 8%)
    return Math.round(taxableAmount * state.taxRate)
  },

  /** @param {CartState} state */
  total: (state) => {
    const subtotal = state.items.reduce((sum, item) => {
      const itemPrice = PriceUtils.normalizePrice(item.price)
      return sum + (itemPrice * item.quantity)
    }, 0)
    
    const discount = state.discountType === '%' 
      ? Math.round(subtotal * (Number(state.discountValue) / 100))
      : (() => {
          const discountValue = Number(state.discountValue) || 0
          if (Number.isInteger(discountValue) && discountValue > 0 && discountValue < 100) {
            return discountValue * 100
          }
          return PriceUtils.normalizePrice(state.discountValue)
        })()
    
    
    const taxableAmount = subtotal - discount
    // Use tax rate directly since it's already in decimal form
    const taxAmount = Math.round(taxableAmount * state.taxRate)
    
    return Math.round(taxableAmount + taxAmount)
  },

  /** @param {CartState} state */
  itemCount: (state) => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0)
  },

  /** @param {CartState} state */
  isEmpty: (state) => {
    return state.items.length === 0
  },

  /** @param {CartState} state */
  isHoldOrder: (state) => {
    return state.holdInvoiceId !== null
  },

  /** @param {CartState} state */
  orderType: (state) => {
    return state.type || null
  },

  /** @param {CartState} state */
  isValidOrderType: (state) => {
    if (!state.type) return false
    /** @type {string[]} */
    const validTypes = [
      'DINE IN',
      'TO-GO',
      'DELIVERY',
      'PICKUP'
    ]
    return validTypes.includes(state.type)
  },

  /** @param {CartState} state */
 
  isEditingInvoice: (state) => {
    return state.editingInvoiceId !== null
  },

  /** @param {CartState} state */
  canUpdateInvoice: (state) => {
    return state.editingInvoiceId !== null && 
           state.editingInvoiceStatus && ['DRAFT', 'SENT'].includes(state.editingInvoiceStatus)
  }
}