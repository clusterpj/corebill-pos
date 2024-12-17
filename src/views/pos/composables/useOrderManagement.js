import { ref } from 'vue'
import { useCartStore } from '../../../stores/cart-store'
import { useCompanyStore } from '../../../stores/company'
import { posOperations } from '../../../services/api/pos-operations'
import { logger } from '../../../utils/logger'

export function useOrderManagement() {
  const cartStore = useCartStore()
  const companyStore = useCompanyStore()
  const showReferenceDialog = ref(false)
  const error = ref(null)

  const confirmHoldOrder = async (referenceNumber) => {
    if (!referenceNumber) return
    
    try {
      const holdInvoice = cartStore.prepareHoldInvoiceData(
        companyStore.selectedStore,
        companyStore.selectedCashier,
        referenceNumber
      )
      await posOperations.createHoldInvoice(holdInvoice)
      cartStore.clearCart()
    } catch (err) {
      error.value = err.message
      logger.error('Failed to create hold invoice:', err)
      throw err
    }
  }

  const printOrder = async (orderId = null) => {
    try {
      if (orderId) {
        await posOperations.printOrder(orderId)
      } else {
        // Print current cart
        const orderData = {
          items: cartStore.items,
          total: cartStore.total,
          subtotal: cartStore.subtotal,
          tax: cartStore.taxAmount
        }
        
        const response = await posOperations.submitOrder(orderData)
        await posOperations.printOrder(response.invoice.id)
      }
    } catch (err) {
      error.value = err.message
      logger.error('Failed to print order:', err)
      throw err
    }
  }

  const submitOrder = () => {
    showReferenceDialog.value = true
  }

  return {
    showReferenceDialog,
    error,
    confirmHoldOrder,
    printOrder,
    submitOrder
  }
}
