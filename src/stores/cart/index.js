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
  }),

  getters: {
    subtotal: (state) => {
      return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },

    currentTaxes() {
      const taxTypesStore = useTaxTypesStore()
      return taxTypesStore.availableTaxTypes
    },

    taxAmount() {
      const baseAmount = this.subtotal - this.discountAmount
      return this.currentTaxes.reduce((sum, tax) => {
        // Convert percentage to decimal for calculation (e.g., 0.55% = 0.0055)
        const taxRate = tax.percent / 100
        return sum + Math.round(baseAmount * taxRate)
      }, 0)
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
