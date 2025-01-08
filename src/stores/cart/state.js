import { OrderType } from '../../types/order'
import { markRaw } from 'vue'

export const state = () => ({
  items: [], // Each item will have a unique instanceId
  discountType: 'fixed',
  discountValue: 0,
  taxRate: 0.08, // 8% tax rate
  loading: false,
  error: null,
  notes: '',
  selectedTables: [],
  holdInvoiceId: null,
  holdOrderDescription: null,
  type: null, // Add type to state
  editingInvoiceId: null, // Track which invoice is being edited
  editingInvoiceNumber: null, // Track invoice number being edited
  editingInvoiceStatus: null // Track invoice status being edited
})

export const mutations = {
  setNotes(state, notes) {
    if (notes === state.notes) return
    state.notes = markRaw(notes)
  },

  setSelectedTables(state, tables) {
    state.selectedTables = tables
  },

  setHoldInvoiceId(state, id) {
    state.holdInvoiceId = id
    if (!id) {
      state.holdOrderDescription = null
    }
  },

  setHoldOrderDescription(state, description) {
    state.holdOrderDescription = description
  },

  setDiscount(state, { type, value }) {
    state.discountType = type
    state.discountValue = value
  },

  setType(state, type) {
    if (type && !Object.values(OrderType).includes(type)) {
      throw new Error(`Invalid order type: ${type}`)
    }
    state.type = type
  },

  SET_ITEM_MODIFICATIONS(state, { itemId, modifications }) {
    const item = state.items.find(i => i.id === itemId)
    if (item) {
      item.modifications = modifications
    }
  },
  
  SET_ITEM_NOTES(state, { itemId, notes }) {
    const item = state.items.find(i => i.id === itemId)
    if (item) {
      item.notes = notes
    }
  },
  
  UPDATE_ITEM_PRICE(state, { itemId, price }) {
    const item = state.items.find(i => i.id === itemId)
    if (item) {
      item.price = price
    }
  },

  clearCart(state) {
    state.items = []
    state.discountType = 'fixed'
    state.discountValue = 0
    state.notes = ''
    state.selectedTables = []
    state.holdInvoiceId = null
    state.holdOrderDescription = null
    state.type = null // Reset type when clearing cart
    state.editingInvoiceId = null // Reset editing invoice ID
  }
}
