// src/views/pos/composables/useCartDiscount.js
import { ref, watch } from 'vue'
import { useCartStore } from '../../../stores/cart-store'

export function useCartDiscount() {
  const cartStore = useCartStore()
  const discountType = ref(cartStore.$state.discountType)
  const discountValue = ref(cartStore.$state.discountValue)

  // Watch for store changes
  watch(() => cartStore.$state.discountType, (newType) => {
    discountType.value = newType
  })

  watch(() => cartStore.$state.discountValue, (newValue) => {
    discountValue.value = newValue
  })

  const updateDiscount = () => {
    // Convert $ to 'fixed' for API compatibility
    const type = discountType.value === '$' ? 'fixed' : discountType.value
    
    // If type is fixed (dollar amount), use raw value
    // If type is %, use percentage value directly
    const value = Number(discountValue.value) || 0
    
    cartStore.setDiscount(type, value)
  }

  return {
    discountType,
    discountValue,
    updateDiscount
  }
}
