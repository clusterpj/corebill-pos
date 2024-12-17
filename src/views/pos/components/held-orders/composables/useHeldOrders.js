import { ref, computed, onMounted } from 'vue'
import { usePosStore } from '../../../../../stores/pos-store'
import { useCartStore } from '../../../../../stores/cart-store'
import { storeToRefs } from 'pinia'
import { logger } from '../../../../../utils/logger'
import { OrderType, PaidStatus } from '../../../../../types/order'
import { usePayment } from '../../../composables/usePayment'
import { useTableManagement } from '../../../composables/useTableManagement'
import { 
  formatDate, 
  formatCurrency, 
  getOrderType, 
  getOrderTypeColor 
} from '../utils/formatters'
import { parseOrderNotes } from '../../../../../stores/cart/helpers'
import { PriceUtils } from '../../../../../utils/price'

const HISTORY_STORAGE_KEY = 'core_pos_order_history'

export function useHeldOrders() {
  const posStore = usePosStore()
  const cartStore = useCartStore()
  const { holdInvoices, holdInvoiceSettings } = storeToRefs(posStore)
  const { fetchPaymentMethods } = usePayment()
  const { releaseTablesAfterPayment } = useTableManagement()

  // State
  const loading = ref(false)
  const loadingOrder = ref(null)
  const deletingOrder = ref(null)
  const convertingOrder = ref(null)
  const search = ref('')
  const selectedType = ref('ALL')
  const selectedStatus = ref('ALL')
  const showPaymentDialog = ref(false)
  const currentInvoice = ref(null)
  const originalHoldInvoice = ref(null)
  const orderHistory = ref([])

  // Initialize order history from localStorage
  const initializeOrderHistory = () => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        if (Array.isArray(parsedHistory)) {
          orderHistory.value = parsedHistory
          logger.info('Initialized order history from localStorage:', {
            count: orderHistory.value.length,
            firstItem: orderHistory.value[0]?.id
          })
        } else {
          logger.warn('Stored history is not an array, initializing empty array')
          orderHistory.value = []
        }
      } else {
        orderHistory.value = []
        logger.info('No stored history found, initialized empty array')
      }
    } catch (error) {
      logger.error('Failed to initialize order history from localStorage:', error)
      orderHistory.value = []
    }
  }

  // Clear order history
  const clearOrderHistory = () => {
    try {
      orderHistory.value = []
      localStorage.removeItem(HISTORY_STORAGE_KEY)
      logger.info('Order history cleared successfully')
      window.toastr?.['success']('Order history cleared successfully')
      return true
    } catch (error) {
      logger.error('Failed to clear order history:', error)
      window.toastr?.['error']('Failed to clear order history')
      return false
    }
  }

  // Persist order history to localStorage
  const persistOrderHistory = () => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(orderHistory.value))
      logger.debug('Persisted order history to localStorage')
    } catch (error) {
      logger.error('Failed to persist order history to localStorage:', error)
    }
  }

  // Order type options for filter
  const orderTypes = [
    { title: 'All Orders', value: 'ALL' },
    { title: 'Dine In', value: OrderType.DINE_IN },
    { title: 'To Go', value: OrderType.TO_GO },
    { title: 'Delivery', value: OrderType.DELIVERY },
    { title: 'Pickup', value: OrderType.PICKUP }
  ]

  // Move paid order to history
  const moveToHistory = async (invoice) => {
    try {
      // Create a copy of the invoice without table information
      const historicalOrder = {
        ...invoice,
        tables_selected: [],
        hold_tables: [],
        paid_status: PaidStatus.PAID,
        paid_at: new Date().toISOString()
      }

      // Add to history
      orderHistory.value.unshift(historicalOrder)
      persistOrderHistory() // Persist after adding to history

      // Delete the original order
      await deleteOrder(invoice.id)

      // Release the tables
      if (invoice.tables_selected?.length) {
        await releaseTablesAfterPayment(invoice.tables_selected)
      }
      if (invoice.hold_tables?.length) {
        await releaseTablesAfterPayment(invoice.hold_tables)
      }

      return true
    } catch (error) {
      logger.error('Failed to move order to history:', error)
      return false
    }
  }

  // Handle payment completion
  const handlePaymentComplete = async (paymentResult) => {
    console.log('Payment completion handler called with result:', paymentResult)
    
    try {
      logger.info('Payment completed successfully:', paymentResult)
      
      if (!originalHoldInvoice.value?.id) {
        throw new Error('Original hold invoice not found')
      }

      // Create history entry with payment details
      const historyEntry = {
        ...originalHoldInvoice.value,
        paid_status: 'PAID',
        paid_at: new Date().toISOString(),
        payment_details: paymentResult,
        tables_selected: originalHoldInvoice.value.tables_selected || [],
        hold_tables: originalHoldInvoice.value.hold_tables || []
      }

      // Add to history
      orderHistory.value.unshift(historyEntry)
      
      // Persist to localStorage
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(orderHistory.value))
        logger.debug('Order history updated in localStorage')
      } catch (storageError) {
        logger.error('Failed to persist order history:', storageError)
      }

      // Delete the original order
      const deleteSuccess = await deleteOrder(originalHoldInvoice.value.id)
      if (!deleteSuccess) {
        throw new Error('Failed to delete original order')
      }

      // Release any held tables
      if (historyEntry.tables_selected?.length) {
        await releaseTablesAfterPayment(historyEntry.tables_selected)
      }
      if (historyEntry.hold_tables?.length) {
        await releaseTablesAfterPayment(historyEntry.hold_tables)
      }
      
      // Show success message
      window.toastr?.['success']('Payment processed successfully')
      
      // Reset state
      currentInvoice.value = null
      originalHoldInvoice.value = null
      showPaymentDialog.value = false
      
      return true
    } catch (error) {
      console.error('Failed to complete payment process:', error)
      logger.error('Failed to complete payment process:', error)
      window.toastr?.['error']('Failed to complete payment process')
      return false
    }
  }

  // Convert to invoice
  const convertToInvoice = async (invoice) => {
    try {
      if (!invoice?.id) {
        throw new Error('Invalid invoice: missing ID')
      }

      convertingOrder.value = invoice.id
      originalHoldInvoice.value = invoice // Store the original hold invoice
      
      // Get payment methods before showing dialog
      console.log('Fetching payment methods')
      await fetchPaymentMethods()

      // Show payment dialog directly with held order data
      console.log('Setting up payment dialog')
      currentInvoice.value = {
        invoice: invoice,
        invoicePrefix: invoice.invoice_prefix || 'INV',
        nextInvoiceNumber: invoice.id
      }
      showPaymentDialog.value = true
      
      return { success: true }
    } catch (error) {
      console.error('Failed to prepare for payment:', error)
      logger.error('Failed to prepare for payment:', error)
      window.toastr?.['error'](error.message || 'Failed to prepare for payment')
      return {
        success: false,
        error: error.message
      }
    } finally {
      convertingOrder.value = null
    }
  }

  // Load order
  const validateInvoiceData = (invoice) => {
    if (!invoice?.id) {
      throw new Error('Invalid invoice: missing ID')
    }
    if (!Array.isArray(invoice.hold_items)) {
      throw new Error('Invalid invoice: missing items array')
    }
    if (!invoice.type) {
      throw new Error('Invalid invoice: missing order type')
    }
    return true
  }

  const validateItemData = (item) => {
    if (!item.item_id || !item.name) {
      throw new Error(`Invalid item data: missing required fields for item ${item.name || 'unknown'}`)
    }
    if (typeof item.price === 'undefined' || item.price === null) {
      throw new Error(`Invalid item data: missing price for item ${item.name}`)
    }
    if (!item.quantity) {
      throw new Error(`Invalid item data: missing quantity for item ${item.name}`)
    }
    return true
  }

  const processCartProperties = async (invoice) => {
    logger.startGroup('Processing cart properties')
    try {
      // Set discount
      if (invoice.discount_type && invoice.discount) {
        logger.debug('Setting discount:', {
          type: invoice.discount_type,
          amount: invoice.discount
        })
        await cartStore.setDiscount(
          invoice.discount_type,
          Number(invoice.discount)
        )
      }
      
      // Set tip
      if (invoice.tip_type && invoice.tip) {
        logger.debug('Setting tip:', {
          type: invoice.tip_type,
          amount: invoice.tip
        })
        await cartStore.setTip(
          invoice.tip_type,
          Number(invoice.tip)
        )
      }

      // Set order type
      logger.debug('Setting order type:', invoice.type)
      await cartStore.setType(invoice.type)

      // Process notes
      if (invoice.notes) {
        logger.debug('Processing order notes')
        try {
          const notesObj = JSON.parse(invoice.notes)
          const customerNotes = parseOrderNotes(invoice.notes)
          const newNotes = {
            orderInfo: {
              customer: notesObj.orderInfo?.customer || notesObj.customer || {}
            },
            customerNotes: customerNotes
          }
          await cartStore.setNotes(JSON.stringify(newNotes))
        } catch (e) {
          logger.warn('Failed to parse notes, using raw value:', e)
          await cartStore.setNotes(invoice.notes)
        }
      }

      // Set reference information
      logger.debug('Setting reference information:', {
        id: invoice.id,
        description: invoice.description
      })
      
      // Check if methods exist before calling
      if (typeof cartStore.setHoldInvoiceId !== 'function') {
        throw new Error('setHoldInvoiceId is not defined in cart store')
      }
      if (typeof cartStore.setHoldOrderDescription !== 'function') {
        throw new Error('setHoldOrderDescription is not defined in cart store')
      }

      await cartStore.setHoldInvoiceId(invoice.id)
      await cartStore.setHoldOrderDescription(invoice.description)
      
      logger.debug('Cart properties processed successfully')
    } catch (error) {
      logger.error('Failed to process cart properties:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  }

  const loadOrder = async (invoice) => {
    loadingOrder.value = invoice.id
    logger.startGroup('Loading held order')

    // Helper function to detect and normalize price
    const normalizePriceFromBackend = (price) => {
      // If price is a string, convert to number
      const numPrice = Number(price)
      
      // Log the incoming price for debugging
      logger.debug('Normalizing price:', {
        original: price,
        asNumber: numPrice,
        hasDecimals: numPrice % 1 !== 0,
        isLargeNumber: numPrice > 1000
      })

      // Handle different price formats:
      // 1. Prices in cents without decimals (e.g., 2499 for $24.99)
      // 2. Prices in dollars with decimals (e.g., 24.99)
      // 3. Prices in cents with decimals (e.g., 24.99 meant to be $0.2499)
      
      if (Number.isNaN(numPrice)) {
        logger.warn('Invalid price value:', price)
        return 0
      }

      // Case 1: If price is a large number without decimals, assume it's in cents
      // e.g., 2499 -> $24.99
      if (numPrice > 100 && Number.isInteger(numPrice)) {
        const normalized = numPrice / 100
        logger.debug('Normalized large integer price:', {
          original: numPrice,
          normalized,
          formatted: PriceUtils.format(normalized)
        })
        return normalized
      }

      // Case 2: If price already has decimals, it's likely in the correct format
      // e.g., 24.99 -> $24.99
      if (numPrice % 1 !== 0) {
        logger.debug('Price already has decimals, keeping as is:', {
          price: numPrice,
          formatted: PriceUtils.format(numPrice)
        })
        return numPrice
      }

      // Case 3: Small integer prices likely don't need normalization
      // e.g., 25 -> $25.00
      logger.debug('Small integer price, keeping as is:', {
        price: numPrice,
        formatted: PriceUtils.format(numPrice)
      })
      return numPrice
    }

    try {
      // Validate invoice structure
      validateInvoiceData(invoice)
      
      logger.debug('Loading order details:', {
        id: invoice.id,
        description: invoice.description,
        type: invoice.type,
        itemCount: invoice.hold_items?.length
      })

      // Clear current cart
      await cartStore.clearCart()
      logger.debug('Cart cleared successfully')

      // Process items
      logger.debug(`Processing ${invoice.hold_items.length} items`)
      for (const item of invoice.hold_items) {
        validateItemData(item)

        // Normalize the price from backend
        const normalizedPrice = normalizePriceFromBackend(item.price)

        logger.debug('Processing item price:', {
          itemName: item.name,
          originalPrice: item.price,
          normalizedPrice,
          formattedPrice: PriceUtils.format(normalizedPrice)
        })

        const product = {
          id: item.item_id,
          name: item.name,
          description: item.description,
          price: normalizedPrice,
          unit_name: item.unit_name,
          fromHeldOrder: true  // Mark item as coming from held order
        }

        logger.debug('Adding item to cart:', {
          productId: product.id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
          formattedPrice: PriceUtils.format(product.price)
        })

        try {
          await cartStore.addItem(product, Number(item.quantity))
        } catch (error) {
          throw new Error(`Failed to add item ${product.name} to cart: ${error.message}`)
        }
      }

      // Process cart properties
      await processCartProperties(invoice)
      
      logger.info('Order loaded successfully:', {
        id: invoice.id,
        description: invoice.description,
        type: invoice.type,
        itemCount: invoice.hold_items.length,
        cartState: {
          items: cartStore.items?.length,
          total: cartStore.total,
          holdInvoiceId: cartStore.holdInvoiceId
        }
      })
      
      return true
    } catch (error) {
      logger.error('Failed to load order:', {
        error: error.message,
        errorStack: error.stack,
        invoice: {
          id: invoice?.id,
          type: invoice?.type,
          itemCount: invoice?.hold_items?.length
        },
        cartStore: {
          methods: Object.keys(cartStore),
          state: {
            items: cartStore.items?.length,
            total: cartStore.total,
            holdInvoiceId: cartStore.holdInvoiceId
          }
        }
      })
      window.toastr?.['error'](error.message || 'Failed to load order')
      return false
    } finally {
      loadingOrder.value = null
      logger.endGroup()
    }
  }

  // Delete order
  const deleteOrder = async (invoiceId) => {
    try {
      if (!invoiceId) {
        throw new Error('Invalid invoice ID')
      }

      deletingOrder.value = invoiceId
      logger.debug('Deleting hold invoice:', invoiceId)
      
      const response = await posStore.deleteHoldInvoice(invoiceId)
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete order')
      }

      window.toastr?.['success']('Order deleted successfully')
      return true
    } catch (error) {
      logger.error('Failed to delete order:', error)
      window.toastr?.['error'](error.message || 'Failed to delete order')
      return false
    } finally {
      deletingOrder.value = null
    }
  }

  // Fetch held orders
  const fetchHoldInvoices = async () => {
    try {
      loading.value = true
      await posStore.fetchHoldInvoices()
    } catch (error) {
      logger.error('Failed to fetch hold invoices:', error)
      window.toastr?.['error']('Failed to fetch hold invoices')
    } finally {
      loading.value = false
    }
  }

  // Initialize on mount
  onMounted(() => {
    initializeOrderHistory()
  })

  return {
    // State
    loading,
    loadingOrder,
    deletingOrder,
    convertingOrder,
    search,
    selectedType,
    selectedStatus,
    orderTypes,
    holdInvoices,
    orderHistory,
    filteredInvoices: computed(() => holdInvoices.value),
    showPaymentDialog,
    currentInvoice,

    // Formatters
    getOrderType,
    getOrderTypeColor,
    formatDate,
    formatCurrency,

    // Actions
    convertToInvoice,
    loadOrder,
    deleteOrder,
    fetchHoldInvoices,
    handlePaymentComplete,
    clearOrderHistory
  }
}
