import { ref } from 'vue'
import { useCartStore } from '../../../../../stores/cart-store'
import { usePosStore } from '../../../../../stores/pos-store'
import { useTaxTypesStore } from '../../../../../stores/tax-types'
import { logger } from '../../../../../utils/logger'

export function useCart() {
  const cartStore = useCartStore()
  const posStore = usePosStore()
  const taxTypesStore = useTaxTypesStore()
  const updating = ref(false)

  const clearOrder = () => {
    try {
      logger.debug('Clearing order, current state:', {
        items: cartStore.items?.length,
        total: cartStore.total
      })
      cartStore.clearCart()
    } catch (error) {
      logger.error('Error clearing order:', error)
      window.toastr?.['error']('Failed to clear order')
    }
  }

  const updateQuantity = (itemId, quantity, index) => {
    cartStore.updateItemQuantity(itemId, quantity, index)
  }

  const removeItem = (itemId, index) => {
    cartStore.removeItem(itemId, index)
  }

  // Preserve the exact update functionality as specified
  const updateOrder = async () => {
    try {
      const description = cartStore.holdOrderDescription
      logger.debug('Attempting to update order:', {
        description,
        hasDescription: !!description,
        cartState: {
          items: cartStore.items?.length,
          total: cartStore.total,
          holdInvoiceId: cartStore.holdInvoiceId,
          taxes: taxTypesStore.availableTaxTypes
        }
      })

      if (!description) {
        throw new Error('No order description found')
      }

      updating.value = true

      // Ensure tax types are loaded
      if (!taxTypesStore.taxTypes.length) {
        await taxTypesStore.fetchTaxTypes()
      }

      // Prepare the order data with current tax rates
      const orderData = cartStore.prepareHoldInvoiceData(
        posStore.selectedStore,
        posStore.selectedCashier,
        description
      )

      // Log tax information for debugging
      logger.debug('Updating order with tax details:', {
        subtotal: orderData.sub_total,
        discount: orderData.discount_val,
        taxes: orderData.taxes,
        totalTax: orderData.tax,
        total: orderData.total
      })

      // Update the hold invoice using description as identifier
      const response = await posStore.updateHoldInvoice(description, orderData)

      if (response.success) {
        window.toastr?.['success']('Order updated successfully')
        // Clear the hold invoice ID after successful update
        cartStore.setHoldInvoiceId(null)
        // Clear the cart after successful update
        cartStore.clearCart()
      } else {
        throw new Error(response.message || 'Failed to update order')
      }
    } catch (error) {
      logger.error('Failed to update order:', error)
      window.toastr?.['error'](error.message || 'Failed to update order')
    } finally {
      updating.value = false
    }
  }

  return {
    cartStore,
    updating,
    clearOrder,
    updateQuantity,
    removeItem,
    updateOrder
  }
}
