import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import { Order, OrderStatus } from '@/types/order'
import { useSectionOrdersStore } from './section-orders.store'

export const useBarStore = defineStore('bar', () => {
  // State
  const activeOrders = ref<Order[]>([])
  const completedOrders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed Getters
  const orderCount = computed(() => activeOrders.value.length)
  const hasActiveOrders = computed(() => orderCount.value > 0)

  // Actions
  async function initializeOrders(
    holdInvoices: Order[] = [], 
    directInvoices: Order[] = []
  ) {
    try {
      logger.debug('Initializing bar orders', { 
        holdInvoicesCount: holdInvoices.length, 
        directInvoicesCount: directInvoices.length 
      })

      const sectionStore = useSectionOrdersStore()
      loading.value = true

      // Ensure sections are loaded
      await sectionStore.fetchSections()

      // Process orders to include section information
      const processOrder = async (order: Order) => {
        // Process each item to include section info
        const items = await Promise.all(
          (order.items || []).map(async item => {
            const sections = await sectionStore.getSectionsForItem(item.id)
            const section = sections[0] // Get primary section
            return {
              ...item,
              section_id: section?.id,
              section_type: section?.type,
              section_name: section?.name
            }
          })
        )

        return {
          ...order,
          items
        }
      }

      // Combine and deduplicate orders
      const combinedOrders = [
        ...holdInvoices, 
        ...directInvoices
      ].filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      )

      // Process all orders
      const processedOrders = await Promise.all(
        combinedOrders.map(processOrder)
      )

      // Filter bar-related orders and sort by creation time
      const barOrders = processedOrders
        .filter(order => 
          order.items?.some(item => item.section_type === 'bar')
        )
        .sort((a, b) => 
          new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        )

      // Update active and completed orders
      activeOrders.value = barOrders.filter(
        order => order.status !== OrderStatus.COMPLETED
      )
      
      completedOrders.value = barOrders.filter(
        order => order.status === OrderStatus.COMPLETED
      )

      logger.info('Bar orders initialized', { 
        activeOrdersCount: activeOrders.value.length,
        completedOrdersCount: completedOrders.value.length 
      })
    } catch (err) {
      logger.error('Failed to initialize bar orders', err)
      error.value = 'Failed to load bar orders'
    } finally {
      loading.value = false
    }
  }

  async function completeOrder(orderId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      // Find order in active orders
      const orderIndex = activeOrders.value.findIndex(o => o.id === orderId)
      if (orderIndex === -1) {
        throw new Error(`Order ${orderId} not found in active orders`)
      }

      // Update order status
      const completedOrder = {
        ...activeOrders.value[orderIndex],
        status: OrderStatus.COMPLETED,
        completed_at: new Date().toISOString()
      }

      // Move to completed orders
      completedOrders.value.push(completedOrder)
      activeOrders.value.splice(orderIndex, 1)

      logger.info(`Order ${orderId} marked as completed`)
      return true
    } catch (err) {
      logger.error(`Failed to complete order ${orderId}`, err)
      error.value = `Failed to complete order: ${err.message}`
      return false
    } finally {
      loading.value = false
    }
  }

  // Reset store state
  function $reset() {
    activeOrders.value = []
    completedOrders.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    activeOrders,
    completedOrders,
    loading,
    error,

    // Computed
    orderCount,
    hasActiveOrders,

    // Actions
    initializeOrders,
    completeOrder,
    $reset
  }
})
