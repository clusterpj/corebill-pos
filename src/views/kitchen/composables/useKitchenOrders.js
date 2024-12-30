import { ref, onMounted, onUnmounted } from 'vue'
import { usePosStore } from '@/stores/pos-store'
import { useKitchenStore } from '@/stores/kitchen'
import { logger } from '@/utils/logger'
import { errorHandler } from '@/utils/errorHandler'
import { KitchenService } from '@/services/api/kitchen-service'

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
      
      // Use the new KitchenService
      const orders = await KitchenService.fetchOrders(1) // Kitchen section ID
      
      // Initialize kitchen orders with backward compatibility
      if (posStore.holdInvoices) {
        // Merge existing hold invoices with kitchen orders
        const mergedOrders = [...orders, ...posStore.holdInvoices.filter(order => 
          !orders.some(o => o.id === order.id)
        )]
        kitchenStore.initializeOrders(mergedOrders)
      } else {
        kitchenStore.initializeOrders(orders)
      }

      logger.info(`Fetched ${kitchenStore.activeOrders.length} active orders and ${kitchenStore.completedOrders.length} completed orders`)
    } catch (err) {
      const appError = errorHandler.handle(err, 'useKitchenOrders.fetchOrders')
      error.value = appError.message
    } finally {
      loading.value = false
    }
  }

  const markOrderComplete = async (orderId) => {
    try {
      loading.value = true
      error.value = null

      // Use the new KitchenService
      await KitchenService.updateOrderStatus(orderId, 'completed')

      // Maintain backward compatibility with posStore
      if (posStore.updateHoldInvoice) {
        await posStore.updateHoldInvoice(orderId, {
          status: 'completed',
          completed_at: new Date().toISOString()
        })
      }

      // Update kitchen store
      await kitchenStore.completeOrder(orderId)
      
      logger.info(`Order ${orderId} marked as complete`)
    } catch (err) {
      const appError = errorHandler.handle(err, 'useKitchenOrders.markOrderComplete')
      error.value = appError.message
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
