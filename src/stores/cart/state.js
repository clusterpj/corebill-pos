import { OrderType } from '../../types/order'
import { markRaw } from 'vue'

export const state = () => ({
  items: [],
  discountType: 'fixed',
  discountValue: 0,
  // Removed old taxRate property
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
