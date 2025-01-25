import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import { 
  Order, 
  OrderType, 
  OrderStatus, 
  PosStatus,
  OrderStatusChangeRequest,
  OrderItemStatusChangeRequest
} from '@/types/order'
import { useSectionOrdersStore } from './section-orders.store'
import { KitchenService } from '@/services/api/kitchen-service'

// Define valid kitchen order types
const KITCHEN_ORDER_TYPES = [
  OrderType.DINE_IN,
  OrderType.TO_GO,
  OrderType.DELIVERY,
  OrderType.PICKUP
] as const

export const useKitchenStore = defineStore('kitchen', () => {
  // State
  const orders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeOrders = computed(() =>
    orders.value.filter(order =>
      // Only show non-completed orders
      order.pos_status !== PosStatus.COMPLETED &&
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.CANCELLED
    )
  )

  const completedOrders = computed(() =>
    orders.value.filter(order =>
      // Show completed or cancelled orders
      order.pos_status === PosStatus.COMPLETED ||
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    )
  )

  // Actions
  const initializeOrders = async (holdInvoices: Order[] = [], directInvoices: Order[] = []) => {
    const sectionStore = useSectionOrdersStore()
    loading.value = true

    try {
      // Ensure sections are loaded
      await sectionStore.fetchSections()

      // Process and filter orders
      const processOrder = async (order: Order) => {
        // Skip orders without items
        if (!order.items?.length) {
          logger.debug('Skipping order without items:', order.id)
          return null
        }

        // Only include orders with kitchen items
        const hasKitchenItems = order.items.some(item => 
          item.section_type === 'kitchen' || 
          item.section_name?.toUpperCase() === 'KITCHEN'
        )

        if (!hasKitchenItems) {
          logger.debug('Skipping non-kitchen order:', order.id)
          return null
        }

        return {
          ...order,
          completed_at: order.completed_at || null,
          status: order.status || OrderStatus.PENDING,
          created_at: order.created_at || new Date().toISOString(),
          type: order.type || OrderType.DINE_IN,
          // Add formatted reference for easy display
          reference: order.type === 'Invoice' ? order.invoice_number : `Hold #${order.id}`,
          // Add display type for UI
          displayType: order.type === 'Invoice' ? 'Invoice' : 'Hold Order'
        }
      }

      // Process all orders
      const processedOrders = (await Promise.all([
        ...holdInvoices.map(order => processOrder(order)),
        ...directInvoices.map(order => processOrder(order))
      ])).filter((order): order is Order => order !== null)

      // Sort orders by creation date
      orders.value = processedOrders.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )

      logger.info(`Initialized ${orders.value.length} kitchen orders`)
      persistOrders()
    } catch (err) {
      error.value = 'Failed to initialize kitchen orders'
      logger.error('Error initializing kitchen orders:', err)
    } finally {
      loading.value = false
    }
  }

  const completeOrder = async (orderId: number) => {
    try {
      const order = orders.value.find(o => o.id === orderId)
      if (!order) {
        throw new Error(`Order ${orderId} not found`)
      }

      // Mark order and all its items as completed
      await KitchenService.changeOrderStatus({
        orderId,
        type: order.type === 'Invoice' ? 'INVOICE' : 'HOLD',
        pos_status: PosStatus.COMPLETED
      })
      
      // Mark all items as completed
      for (const item of order.items) {
        await KitchenService.changeOrderItemStatus({
          orderId,
          itemId: item.id,
          type: order.type === 'Invoice' ? 'INVOICE' : 'HOLD',
          pos_status: PosStatus.COMPLETED
        })
      }

      // Update local state
      const updatedOrder = {
        ...order,
        pos_status: PosStatus.COMPLETED,
        completed_at: new Date().toISOString(),
        items: order.items.map(item => ({
          ...item,
          pos_status: PosStatus.COMPLETED
        }))
      }

      // Update the order in the store
      const orderIndex = orders.value.findIndex(o => o.id === orderId)
      if (orderIndex !== -1) {
        orders.value[orderIndex] = updatedOrder
      }

      persistOrders()
      logger.info(`Order ${orderId} marked as completed`)
    } catch (error) {
      logger.error(`Failed to complete order ${orderId}:`, error)
      throw error
    }
  }

  const completeOrderItem = async (orderId: number, itemId: number) => {
    try {
      const order = orders.value.find(o => o.id === orderId)
      if (!order) {
        throw new Error(`Order ${orderId} not found`)
      }

      const item = order.items.find(i => i.id === itemId)
      if (!item) {
        throw new Error(`Item ${itemId} not found in order ${orderId}`)
      }

      // Determine order type based on invoice_number presence
      const orderType = order.invoice_number ? 'INVOICE' : 'HOLD'
      logger.debug(`Completing item ${itemId} in ${orderType} order ${orderId}`, {
        order: {
          id: order.id,
          type: orderType,
          invoice_number: order.invoice_number
        },
        item: {
          id: itemId,
          name: item.name
        }
      })

      // Mark the specific item as completed
      await KitchenService.changeOrderItemStatus({
        orderId,
        itemId,
        type: orderType,
        pos_status: PosStatus.COMPLETED
      })

      // Update local state
      const orderIndex = orders.value.findIndex(o => o.id === orderId)
      if (orderIndex !== -1) {
        const updatedItems = orders.value[orderIndex].items.map(item =>
          item.id === itemId ? { ...item, pos_status: PosStatus.COMPLETED } : item
        )
        orders.value[orderIndex] = {
          ...orders.value[orderIndex],
          items: updatedItems,
          // Update order status if all items are completed
          pos_status: updatedItems.every(item => item.pos_status === PosStatus.COMPLETED) 
            ? PosStatus.COMPLETED 
            : PosStatus.PENDING
        }
      }

      persistOrders()
      logger.info(`Item ${itemId} in ${orderType} order ${orderId} marked as completed`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Failed to complete item ${itemId} in order ${orderId}:`, {
        error: errorMessage,
        orderId,
        itemId
      })
      throw error
    }
  }

  // Persistence helpers
  const STORAGE_KEY = 'kitchen_orders'

  const persistOrders = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.value))
    } catch (err) {
      logger.error('Failed to persist orders:', err)
    }
  }

  const loadPersistedOrders = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        orders.value = JSON.parse(stored)
      }
    } catch (err) {
      logger.error('Failed to load persisted orders:', err)
    }
  }

  // Load persisted orders on store initialization
  loadPersistedOrders()

  return {
    // State
    orders,
    loading,
    error,
    
    // Getters
    activeOrders,
    completedOrders,
    
    // Actions
    initializeOrders,
    completeOrder,
    completeOrderItem
  }
})
