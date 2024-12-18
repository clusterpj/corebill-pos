import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import { OrderType } from '@/types/order'

// Define valid kitchen order types
const KITCHEN_ORDER_TYPES = [OrderType.DINE_IN, OrderType.TO_GO]

export const useKitchenStore = defineStore('kitchen', () => {
  // State
  const orders = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const activeOrders = computed(() => 
    orders.value.filter(order => 
      // Only show kitchen orders (dine-in and to-go)
      KITCHEN_ORDER_TYPES.includes(order.type) &&
      // Only show non-completed orders
      !order.completed_at && 
      order.status !== 'completed' &&
      order.status !== 'cancelled'
    )
  )

  const completedOrders = computed(() => 
    orders.value.filter(order => 
      // Only show kitchen orders
      KITCHEN_ORDER_TYPES.includes(order.type) &&
      // Show completed or cancelled orders
      (order.completed_at || 
       order.status === 'completed' || 
       order.status === 'cancelled')
    )
  )

  // Actions
  const initializeOrders = (initialOrders) => {
    // Filter and map orders
    orders.value = initialOrders
      .filter(order => KITCHEN_ORDER_TYPES.includes(order.type))
      .map(order => ({
        ...order,
        completed_at: order.completed_at || null,
        status: order.status || 'pending',
        // Add timestamp for sorting
        created_at: order.created_at || new Date().toISOString()
      }))

    // Sort by creation time, newest first
    orders.value.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )

    logger.info(`Initialized ${orders.value.length} kitchen orders`)
    
    // Persist to localStorage
    persistOrders()
  }

  const addOrder = (order) => {
    if (!KITCHEN_ORDER_TYPES.includes(order.type)) {
      logger.debug('Ignoring non-kitchen order:', order.type)
      return
    }

    // Add the order with proper initialization
    orders.value.unshift({
      ...order,
      completed_at: null,
      status: 'pending',
      created_at: new Date().toISOString()
    })

    logger.info(`Added new ${order.type} order to kitchen`)
    persistOrders()
  }

  const completeOrder = async (orderId) => {
    loading.value = true
    error.value = null

    try {
      // Find the order
      const orderIndex = orders.value.findIndex(o => o.id === orderId)
      if (orderIndex === -1) {
        throw new Error(`Order #${orderId} not found`)
      }

      // Update the order
      orders.value[orderIndex] = {
        ...orders.value[orderIndex],
        status: 'completed',
        completed_at: new Date().toISOString()
      }

      // Store in localStorage for persistence
      persistOrders()

      logger.info(`Order #${orderId} marked as completed`)
      return true
    } catch (err) {
      error.value = err.message
      logger.error('Error completing order:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Persistence helpers
  const STORAGE_KEY = 'kitchen_orders'

  const persistOrders = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.value))
      logger.debug('Kitchen orders persisted to localStorage')
    } catch (error) {
      logger.error('Failed to persist kitchen orders:', error)
    }
  }

  const loadPersistedOrders = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        orders.value = JSON.parse(stored)
        logger.info(`Loaded ${orders.value.length} kitchen orders from localStorage`)
      }
    } catch (error) {
      logger.error('Failed to load persisted kitchen orders:', error)
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
    addOrder,
    completeOrder
  }
})
