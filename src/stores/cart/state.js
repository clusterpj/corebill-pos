import { OrderType } from '../../types/order'

export const state = () => ({
  items: [],
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
    state.notes = notes
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
  },

  splitItem(state, { index, splitQuantity }) {
    const item = state.items[index]
    if (!item || splitQuantity >= item.quantity) return

    // Create new item with split quantity
    const splitItem = {
      ...item,
      quantity: splitQuantity,
      modifications: [...(item.modifications || [])]
    }

    // Update original item quantity
    state.items[index].quantity -= splitQuantity

    // Insert split item after original
    state.items.splice(index + 1, 0, splitItem)
  },

  addModification(state, { itemIndex, modification }) {
    const item = state.items[itemIndex]
    if (!item) return

    if (!item.modifications) {
      item.modifications = []
    }
    item.modifications.push(modification)
  },

  removeModification(state, { itemIndex, modificationIndex }) {
    const item = state.items[itemIndex]
    if (!item?.modifications) return

    item.modifications.splice(modificationIndex, 1)
  },

  addItem(state, item) {
    state.items.push({
      ...item,
      modifications: [] // Initialize modifications array
    })
  }
}
