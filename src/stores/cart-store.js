import { defineStore } from 'pinia'
import { state, mutations } from './cart/state'
import { getters } from './cart/getters'
import { actions } from './cart/actions'
import { invoiceActions } from './cart/invoice'

export const useCartStore = defineStore('cart', {
  state,
  getters,
  actions: {
    // Item management actions
    addItem(product, quantity = 1) {
      actions.addItem(this, product, quantity)
    },

    updateItemQuantity(itemId, quantity, index = null) {
      actions.updateItemQuantity(this, { itemId, quantity, index })
    },

    removeItem(itemId, index = null) {
      actions.removeItem(this, { itemId, index })
    },

    splitItem(index, splitQuantity) {
      mutations.splitItem(this, { index, splitQuantity })
    },

    addModification(itemIndex, modification) {
      mutations.addModification(this, { itemIndex, modification })
    },

    removeModification(itemIndex, modificationIndex) {
      mutations.removeModification(this, { itemIndex, modificationIndex })
    },

    // State mutations
    setDiscount(type, value) {
      mutations.setDiscount(this, { type, value })
    },

    setNotes(notes) {
      mutations.setNotes(this, notes)
    },

    setType(type) {
      mutations.setType(this, type)
    },

    setSelectedTables(tables) {
      mutations.setSelectedTables(this, tables)
    },

    setHoldInvoiceId(id) {
      mutations.setHoldInvoiceId(this, id)
    },

    setHoldOrderDescription(description) {
      mutations.setHoldOrderDescription(this, description)
    },

    clearCart() {
      mutations.clearCart(this)
    },

    loadInvoice(invoice) {
      actions.loadInvoice(this, invoice)
    },

    async updateInvoice() {
      return actions.updateInvoice(this)
    },

    // Invoice preparation actions
    prepareInvoiceData(storeId, cashRegisterId, referenceNumber) {
      return invoiceActions.prepareInvoiceData(this, this, { 
        storeId, 
        cashRegisterId, 
        referenceNumber 
      })
    },

    prepareHoldInvoiceData(storeId, cashRegisterId, referenceNumber) {
      return invoiceActions.prepareHoldInvoiceData(this, this, {
        storeId,
        cashRegisterId,
        referenceNumber
      })
    }
  }
})
