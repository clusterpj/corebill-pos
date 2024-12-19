import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import { OrderType } from '@/types/order'

// Define valid kitchen order types
const KITCHEN_ORDER_TYPES = [
  OrderType.DINE_IN,
  OrderType.TO_GO,
  OrderType.DELIVERY,
  OrderType.PICKUP
]

export const useKitchenStore = defineStore('kitchen', () => {
  // State
  const orders = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const activeOrders = computed(() => 
    orders.value.filter(order => 
      // Only show non-completed orders
      !order.completed_at && 
      order.status !== 'completed' &&
      order.status !== 'cancelled'
    )
  )

  const completedOrders = computed(() => 
    orders.value.filter(order => 
      // Show completed or cancelled orders
      (order.completed_at || 
       order.status === 'completed' || 
       order.status === 'cancelled')
    )
  )

  // Actions
  const initializeOrders = (holdInvoices = [], directInvoices = []) => {
    // Combine and format all orders
    const allOrders = [
      ...holdInvoices.filter(order => KITCHEN_ORDER_TYPES.includes(order.type))
        .map(order => ({
          ...order,
          source: 'hold_invoice',
          completed_at: order.completed_at || null,
          status: order.status || 'pending',
          created_at: order.created_at || new Date().toISOString()
        })),
      ...directInvoices.filter(invoice => KITCHEN_ORDER_TYPES.includes(invoice.type))
        .map(invoice => ({
          ...invoice,
          source: 'direct_invoice',
          completed_at: invoice.completed_at || null,
          status: invoice.status || 'pending',
          created_at: invoice.created_at || new Date().toISOString(),
          type: invoice.type || 'UNKNOWN'
        }))
    ]

    // Sort by creation time, newest first
    orders.value = allOrders.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )

    logger.info(`Initialized ${orders.value.length} kitchen orders`)
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

  // Add method to add direct invoice
  const addDirectInvoice = (invoice) => {
    if (!invoice || !KITCHEN_ORDER_TYPES.includes(invoice.type)) {
      logger.debug('Ignoring invalid invoice:', invoice?.type)
      return
    }

    const formattedInvoice = {
      ...invoice,
      source: 'direct_invoice',
      completed_at: null,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    orders.value.unshift(formattedInvoice)
    logger.info(`Added new ${invoice.type} order to kitchen`)
    persistOrders()
  }

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
    addDirectInvoice,
    completeOrder
  }
})
