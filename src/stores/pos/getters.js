import { computed } from 'vue'

export const createGetters = (state, cartStore, companyStore) => {
  const hasActiveOrder = computed(() => {
    return cartStore.items.length > 0
  })

  const canPlaceOrder = computed(() => {
    return hasActiveOrder.value && state.activeOrderType.value
  })

  const categoriesForDisplay = computed(() => {
    return [
      { id: 'all', name: 'All Categories', value: 'all' },
      ...(state.categories.value || []).map(category => ({
        id: category.item_category_id,
        name: category.name,
        value: category.item_category_id
      }))
    ]
  })

  const systemReady = computed(() => {
    return companyStore.isConfigured
  })

  const setupMessage = computed(() => {
    if (!companyStore.selectedCustomer) return 'Please select a customer'
    if (!companyStore.selectedStore) return 'Please select a store'
    if (!companyStore.selectedCashier) return 'Please select a cash register'
    return ''
  })

  return {
    hasActiveOrder,
    canPlaceOrder,
    categoriesForDisplay,
    systemReady,
    setupMessage
  }
}
