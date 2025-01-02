import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import { OrderStatus } from '@/types/order'
import { useSectionOrdersStore } from './section-orders.store'

// Define valid kitchen order types
const KITCHEN_ORDER_TYPES = [
  OrderStatus.DINE_IN,
  OrderStatus.TO_GO,
  OrderStatus.DELIVERY,
  OrderStatus.PICKUP
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
  const initializeOrders = async (holdInvoices = [], directInvoices = []) => {
    const sectionStore = useSectionOrdersStore()
    loading.value = true

    try {
      // Ensure sections are loaded
      await sectionStore.fetchSections()

      // Process and filter orders
      const processOrder = async (order, source) => {
        // Skip non-kitchen orders
        if (!KITCHEN_ORDER_TYPES.includes(order.type)) {
          return null
        }

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

        // Only include orders with kitchen items
        if (!items.some(item => item.section_type === 'kitchen')) {
          return null
        }

        return {
          ...order,
          items,
          source,
          completed_at: order.completed_at || null,
          status: order.status || 'pending',
          created_at: order.created_at || new Date().toISOString(),
          type: order.type || 'UNKNOWN'
        }
      }

      // Process all orders
      const processedOrders = await Promise.all([
        ...holdInvoices.map(order => processOrder(order, 'hold_invoice')),
        ...directInvoices.map(order => processOrder(order, 'direct_invoice'))
      ])

      // Filter out null orders and sort
      orders.value = processedOrders
        .filter(order => order !== null)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      logger.info(`Initialized ${orders.value.length} kitchen orders`)
      persistOrders()
    } catch (err) {
      error.value = 'Failed to initialize kitchen orders'
      logger.error('Error initializing kitchen orders:', err)
    } finally {
      loading.value = false
    }
  }

  const addOrder = async (order) => {
    if (!KITCHEN_ORDER_TYPES.includes(order.type)) {
      logger.debug('Ignoring non-kitchen order:', order.type)
      return
    }

    const sectionStore = useSectionOrdersStore()

    try {
      // Process items to include section info
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

      // Only add if there are kitchen items
      if (items.some(item => item.section_type === 'kitchen')) {
        orders.value.unshift({
          ...order,
          items,
          completed_at: null,
          status: 'pending',
          created_at: new Date().toISOString()
        })

        logger.info(`Added new ${order.type} order to kitchen`)
        persistOrders()
      } else {
        logger.debug('Ignoring order with no kitchen items')
      }
    } catch (err) {
      error.value = 'Failed to add kitchen order'
      logger.error('Error adding kitchen order:', err)
    }
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
