import { ref } from 'vue'
import { useCartStore } from '../../../../../stores/cart-store'
import { usePosStore } from '../../../../../stores/pos-store'
import { logger } from '../../../../../utils/logger'

export function useCart() {
  const cartStore = useCartStore()
  const posStore = usePosStore()
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
          holdInvoiceId: cartStore.holdInvoiceId
        }
      })

      if (!description) {
        throw new Error('No order description found')
      }

      updating.value = true

      // Prepare the order data from the current cart state
      const orderData = cartStore.prepareHoldInvoiceData(
        posStore.selectedStore,
        posStore.selectedCashier,
        description
      )

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
