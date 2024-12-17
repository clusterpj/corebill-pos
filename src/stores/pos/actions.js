export const createActions = (state, cartStore) => {
  const setOrderType = (type) => {
    state.activeOrderType.value = type
  }

  const setTableSelection = (table) => {
    state.selectedTable.value = table
  }

  const setOrderReference = (reference) => {
    state.orderReference.value = reference
  }

  const setCustomerInfo = (info) => {
    state.customerInfo.value = info
  }

  const toggleTableMode = (value) => {
    state.isTableMode.value = value
  }

  const resetOrder = () => {
    cartStore.clearCart()
    state.activeOrderType.value = null
    state.selectedTable.value = null
    state.orderReference.value = ''
    state.customerInfo.value = null
  }

  const resetState = () => {
    state.categories.value = []
    state.products.value = []
    state.selectedCategory.value = 'all'
    state.searchQuery.value = ''
    state.currentPage.value = 1
    state.totalItems.value = 0
    state.error.value = null
    state.holdInvoices.value = []
  }

  return {
    setOrderType,
    setTableSelection,
    setOrderReference,
    setCustomerInfo,
    toggleTableMode,
    resetOrder,
    resetState
  }
}
