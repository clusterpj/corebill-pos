import { ref, onMounted, onUnmounted } from 'vue'
import { usePosStore } from '@/stores/pos-store'
import { logger } from '@/utils/logger'

export function useKitchenOrders() {
  const posStore = usePosStore()
  const activeOrders = ref([])
  const completedOrders = ref([])
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
      
      // Split orders into active and completed
      activeOrders.value = orders.filter(order => 
        !order.completed_at && order.status !== 'cancelled'
      )
      completedOrders.value = orders.filter(order => 
        order.completed_at || order.status === 'completed'
      )

      logger.info(`Fetched ${activeOrders.value.length} active orders and ${completedOrders.value.length} completed orders`)
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

      // Refresh orders after update
      await fetchOrders()
      
      logger.info(`Order ${orderId} marked as complete`)
    } catch (err) {
      error.value = err.message
      logger.error('Error completing order:', err)
    } finally {
      loading.value = false
    }
  }

  // Set up polling for real-time updates
  onMounted(() => {
    fetchOrders()
    pollingInterval = setInterval(fetchOrders, 30000) // Poll every 30 seconds
    logger.info('Kitchen orders polling initialized')
  })

  onUnmounted(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      logger.info('Kitchen orders polling cleared')
    }
  })

  return {
    activeOrders,
    completedOrders,
    loading,
    error,
    markOrderComplete,
    refreshOrders: fetchOrders
  }
}
