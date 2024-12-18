import { ref, onMounted, onUnmounted } from 'vue'
import { usePosStore } from '@/stores/pos-store'
import { useKitchenStore } from '@/stores/kitchen'
import { logger } from '@/utils/logger'

export function useKitchenOrders() {
  const posStore = usePosStore()
  const kitchenStore = useKitchenStore()
  const loading = ref(false)
  const error = ref(null)
  let pollingInterval

  const fetchOrders = async () => {
    try {
      loading.value = true
      error.value = null
      
      // Use the same fetchHoldInvoices method from posStore
      await posStore.fetchHoldInvoices()
      
      // Get orders from the store
      const orders = posStore.holdInvoices || []
      
      // Initialize kitchen orders
      kitchenStore.initializeOrders(orders)

      logger.info(`Fetched ${kitchenStore.activeOrders.length} active orders and ${kitchenStore.completedOrders.length} completed orders`)
    } catch (err) {
      error.value = err.message
      logger.error('Error fetching kitchen orders:', err)
    } finally {
      loading.value = false
    }
  }

  const markOrderComplete = async (orderId) => {
    try {
      loading.value = true
      error.value = null

      // Update the hold invoice with completed status
      await posStore.updateHoldInvoice(orderId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      })

      // Update kitchen store
      await kitchenStore.completeOrder(orderId)
      
      logger.info(`Order ${orderId} marked as complete`)
    } catch (err) {
      error.value = err.message
      logger.error('Error completing order:', err)
    } finally {
      loading.value = false
    }
  }

  // Watch for new orders
  const watchForNewOrders = () => {
    if (posStore.holdInvoices) {
      posStore.holdInvoices.forEach(order => {
        // Check if this is a new order that should be added to kitchen
        const existingOrder = kitchenStore.orders.find(o => o.id === order.id)
        if (!existingOrder) {
          kitchenStore.addOrder(order)
        }
      })
    }
  }

  // Set up polling for real-time updates
  onMounted(() => {
    fetchOrders()
    pollingInterval = setInterval(async () => {
      await fetchOrders()
      watchForNewOrders()
    }, 30000) // Poll every 30 seconds
    logger.info('Kitchen orders polling initialized')
  })

  onUnmounted(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      logger.info('Kitchen orders polling cleared')
    }
  })

  return {
    activeOrders: kitchenStore.activeOrders,
    completedOrders: kitchenStore.completedOrders,
    loading,
    error,
    markOrderComplete,
    refreshOrders: fetchOrders
  }
}
