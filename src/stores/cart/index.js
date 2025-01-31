import { defineStore } from 'pinia'
import { useTaxTypesStore } from '../tax-types'
import { logger } from '../../utils/logger'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    discountType: 'fixed',
    discountValue: 0,
    notes: '',
    type: null,
    holdInvoiceId: null,
    holdOrderDescription: null,
    selectedTables: [],
    currentInvoice: null,
  }),

  getters: {
    subtotal: (state) => {
      return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },

    currentTaxes() {
      const taxTypesStore = useTaxTypesStore()
      const taxes = taxTypesStore.availableTaxTypes
      logger.debug('Current taxes in cart store:', taxes)
      return taxes
    },

    taxAmount() {
      const baseAmount = this.subtotal - this.discountAmount
      // Calculate total tax amount without rounding individual taxes
      const totalTax = this.currentTaxes.reduce((sum, tax) => {
        const taxRate = tax.percent / 100
        return sum + (baseAmount * taxRate)
      }, 0)
      // Round the final total tax amount
      return Math.round(totalTax)
    },

    discountAmount: (state) => {
      if (state.discountType === '%') {
        return Math.round(state.subtotal * (state.discountValue / 100))
      }
      return state.discountValue
    },

    total: (state) => {
      return state.subtotal - state.discountAmount + state.taxAmount
    }
  },

  actions: {
    // ...existing actions...

    broadcastCartState() {
      const taxTypesStore = useTaxTypesStore()
      const cartState = {
        items: this.items.map(({ id, name, price, quantity }) => ({
          id, name, price, quantity
        })),
        discountType: this.discountType,
        discountValue: this.discountValue,
        total: this.total,
        subtotal: this.subtotal,
        taxes: taxTypesStore.availableTaxTypes,
        taxAmount: this.taxAmount,
        notes: this.notes,
        type: this.type,
        holdInvoiceId: this.holdInvoiceId,
        holdOrderDescription: this.holdOrderDescription,
        selectedTables: this.selectedTables,
        timestamp: Date.now()
      }

      logger.debug('Cart state saved and broadcasted::', cartState)
      // Broadcast cart update event
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: cartState }))
    },

    saveState() {
      const taxTypesStore = useTaxTypesStore()
      const state = {
        ...this.$state,
        taxes: taxTypesStore.availableTaxTypes,
        taxAmount: this.taxAmount,
        timestamp: Date.now()
      }
      // This is where the log is coming from
      logger.debug('Cart state saved and broadcasted:', state)
      
      // Broadcast state change
      window.postMessage({
        type: 'CART_STATE_UPDATED',
        payload: state
      }, '*')
    }
  }
})
