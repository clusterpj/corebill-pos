import { ref, computed } from 'vue'
import { useCartStore } from '../../../stores/cart-store'
import { usePosStore } from '../../../stores/pos-store'
import { logger } from '../../../utils/logger'
import { posOperations } from '../../../services/api/pos-operations'
import { OrderType } from '../../../types/order'

// Use the OrderType enum from types
export const ORDER_TYPES = OrderType

export function useOrderType() {
  logger.info('[useOrderType] Initializing order type composable')
  
  const cartStore = useCartStore()
  const posStore = usePosStore()
  
  // State
  const orderType = ref(null)
  const customerInfo = ref({
    name: '',
    phone: '',
    instructions: ''
  })
  const customerNotes = ref('')
  const loading = ref(false)
  const error = ref(null)

  // Initialize from cart store
  if (cartStore.type) {
    logger.debug('[useOrderType] Initializing from cart store type:', cartStore.type)
    orderType.value = cartStore.type
  }

  // Initialize customer notes from cart store notes
  if (cartStore.notes) {
    try {
      logger.debug('[useOrderType] Parsing cart store notes')
      const notesObj = JSON.parse(cartStore.notes)
      if (notesObj.customerNotes) {
        customerNotes.value = notesObj.customerNotes
        logger.debug('[useOrderType] Customer notes initialized:', customerNotes.value)
      }
      if (notesObj.orderInfo?.customer) {
        customerInfo.value = {
          ...customerInfo.value,
          ...notesObj.orderInfo.customer
        }
        logger.debug('[useOrderType] Customer info initialized:', customerInfo.value)
      }
    } catch (e) {
      logger.warn('[useOrderType] Failed to initialize from cart notes:', e)
    }
  }

  // Computed
  const isValid = computed(() => {
    if (!orderType.value) {
      logger.debug('[useOrderType] Validation failed: No order type set')
      return false
    }

    const { name, phone, address } = customerInfo.value
    
    switch (orderType.value) {
      case ORDER_TYPES.DINE_IN:
        logger.debug('[useOrderType] Validating DINE_IN order')
        return true // Table selection handled separately
      case ORDER_TYPES.TO_GO:
        logger.debug('[useOrderType] Validating TO_GO order:', { name, phone })
        return name.trim() && phone.trim()
      case ORDER_TYPES.DELIVERY:
        logger.debug('[useOrderType] Validating DELIVERY order:', { name, phone, address })
        return name.trim() && phone.trim() && address.trim()
      case ORDER_TYPES.PICKUP:
        logger.debug('[useOrderType] Validating PICKUP order:', { name, phone })
        return name.trim() && phone.trim()
      default:
        logger.warn('[useOrderType] Invalid order type:', orderType.value)
        return false
    }
  })

  const requiresCustomerInfo = computed(() => {
    return orderType.value && orderType.value !== ORDER_TYPES.DINE_IN
  })

  const canCreateOrder = computed(() => {
    const canCreate = !cartStore.isEmpty && posStore.systemReady
    logger.debug('[useOrderType] Can create order:', { 
      canCreate,
      cartEmpty: cartStore.isEmpty,
      systemReady: posStore.systemReady
    })
    return canCreate
  })

  const currentOrderType = computed(() => {
    try {
      // First check if type is set directly
      if (cartStore.type) {
        logger.debug('[useOrderType] Order type found in cart store:', cartStore.type)
        orderType.value = cartStore.type // Keep local state in sync
        return cartStore.type
      }

      // If we have a held invoice, try to determine type from the name
      if (cartStore.holdInvoiceId) {
        logger.debug('[useOrderType] Determining type from held invoice:', cartStore.holdInvoiceName)
        // Check if any order type prefix exists in the invoice name
        const invoiceName = cartStore.holdInvoiceName || ''
        for (const type of Object.values(ORDER_TYPES)) {
          if (invoiceName.startsWith(type)) {
            logger.debug('[useOrderType] Type determined from invoice name:', type)
            orderType.value = type // Keep local state in sync
            cartStore.setType(type)
            return type
          }
        }
      }

      // If no type found, default to TO_GO for held orders
      if (cartStore.holdInvoiceId) {
        logger.debug('[useOrderType] No type found for held order, defaulting to TO_GO')
        orderType.value = ORDER_TYPES.TO_GO // Keep local state in sync
        cartStore.setType(ORDER_TYPES.TO_GO)
        return ORDER_TYPES.TO_GO
      }

      logger.debug('[useOrderType] No order type found')
      return orderType.value || null
    } catch (e) {
      logger.error('[useOrderType] Error determining current order type:', e)
      return orderType.value || null
    }
  })

  // Helper function to update customer notes
  const updateCustomerNotes = (customer, notes = '') => {
    logger.debug('[useOrderType] Updating customer notes:', { customer, notes })
    const orderData = {
      orderInfo: {
        customer: { ...customer }
      },
      customerNotes: notes
    }
    cartStore.setNotes(JSON.stringify(orderData))
  }

  // Methods
  const setOrderType = (type) => {
    logger.info('[useOrderType] Setting order type:', type)
    
    if (!Object.values(ORDER_TYPES).includes(type)) {
      logger.error('[useOrderType] Invalid order type:', type)
      throw new Error('Invalid order type')
    }
    
    orderType.value = type
    cartStore.setType(type)

    // Reset customer info when changing order type
    customerInfo.value = {
      name: '',
      phone: '',
      address: '',
      pickupTime: '',
      instructions: ''
    }
    error.value = null

    // Initialize notes structure with empty notes
    const orderData = {
      orderInfo: {
        customer: { ...customerInfo.value }
      },
      customerNotes: ''
    }
    cartStore.setNotes(JSON.stringify(orderData))
    customerNotes.value = '' // Reset local notes state
    logger.debug('[useOrderType] Order type set, state reset')
  }

  const setCustomerInfo = (info) => {
    logger.debug('[useOrderType] Setting customer info:', info)
    customerInfo.value = {
      ...customerInfo.value,
      ...info
    }
    // Update notes with new customer info
    updateCustomerNotes(customerInfo.value, customerNotes.value)
  }

  const setCustomerNotes = (notes) => {
    logger.debug('[useOrderType] Setting customer notes:', notes)
    customerNotes.value = notes
    // Update notes while preserving customer info
    updateCustomerNotes(customerInfo.value, notes)
  }

  const processOrder = async (options = {}) => {
    logger.info('[useOrderType] Starting order processing', {
      orderType: orderType.value,
      customerInfo: customerInfo.value,
      isValid: isValid.value,
      canCreateOrder: canCreateOrder.value
    })

    if (!isValid.value) {
      logger.warn('[useOrderType] Invalid order information')
      throw new Error('Invalid order information')
    }

    if (!canCreateOrder.value) {
      logger.warn('[useOrderType] Cannot create order', {
        cartEmpty: cartStore.isEmpty,
        systemReady: posStore.systemReady
      })
      throw new Error('Cannot create order: Cart is empty or system is not ready')
    }

    loading.value = true
    error.value = null

    try {
      // Update customer notes
      updateCustomerNotes(customerInfo.value, customerNotes.value)

      // For dine-in, tables are handled separately
      if (orderType.value === ORDER_TYPES.DINE_IN) {
        logger.info('[useOrderType] Processing DINE_IN order')
        return { success: true }
      }

      // For TO_GO orders, create a hold invoice ready for immediate conversion
      if (orderType.value === ORDER_TYPES.TO_GO) {
        if (!options.storeId || !options.cashierId) {
          throw new Error('Store and cashier IDs are required for TO-GO orders')
        }

        // Update customer info with provided data
        if (options.customerInfo) {
          customerInfo.value = {
            name: options.customerInfo.name,
            phone: options.customerInfo.phone,
            instructions: options.customerInfo.instructions
          }
        }

        const orderName = options.orderName || `${orderType.value}_${customerInfo.value.name}`
        logger.info('[useOrderType] Processing TO_GO order:', { 
          orderName,
          storeId: options.storeId,
          cashierId: options.cashierId,
          customerInfo: customerInfo.value
        })

        const holdOrderData = cartStore.prepareHoldInvoiceData(
          options.storeId,
          options.cashierId,
          orderName
        )

        // Ensure only relevant customer info is included
        const orderInfo = {
          customer: {
            name: customerInfo.value.name,
            phone: customerInfo.value.phone,
            instructions: customerInfo.value.instructions
          }
        }
        
        holdOrderData.notes = JSON.stringify({ orderInfo })

        // Add flags for immediate conversion
        holdOrderData.is_prepared_data = true
        holdOrderData.is_invoice_pos = 1
        holdOrderData.is_hold_invoice = true
        
        logger.debug('[useOrderType] TO_GO hold order data prepared:', holdOrderData)
        const holdResult = await posStore.holdOrder(holdOrderData)

        logger.info('[useOrderType] TO_GO order created successfully:', holdResult.data)
        return {
          success: true,
          data: holdResult.data
        }
      }

      // For other types (DELIVERY, PICKUP), create regular hold invoice
      const orderData = cartStore.prepareHoldInvoiceData(
        posStore.selectedStore,
        posStore.selectedCashier,
        `${orderType.value}_${customerInfo.value.name}`
      )

      logger.debug('[useOrderType] Processing regular order:', orderData)
      const result = await posStore.holdOrder(orderData)
      
      if (!result?.success) {
        logger.error('[useOrderType] Failed to process order:', result)
        throw new Error(result?.message || 'Failed to process order')
      }

      // Even if data is missing, if success is true, consider it successful
      logger.info('[useOrderType] Order processed successfully:', result)
      return {
        success: true,
        data: result.data || result
      }

    } catch (err) {
      logger.error('[useOrderType] Order processing failed:', {
        error: err,
        orderType: orderType.value,
        customerInfo: customerInfo.value
      })
      error.value = err.message || 'Failed to process order'
      throw err
    } finally {
      loading.value = false
      logger.debug('[useOrderType] Order processing completed')
    }
  }

  const reset = () => {
    logger.debug('[useOrderType] Resetting state')
    orderType.value = null
    cartStore.setType(null)
    customerInfo.value = {
      name: '',
      phone: '',
      address: '',
      pickupTime: '',
      instructions: ''
    }
    customerNotes.value = ''
    error.value = null
  }

  return {
    // State
    orderType,
    customerInfo,
    customerNotes,
    loading,
    error,

    // Computed
    isValid,
    requiresCustomerInfo,
    canCreateOrder,
    currentOrderType,

    // Methods
    setOrderType,
    setCustomerInfo,
    setCustomerNotes,
    processOrder,
    reset,

    // Constants
    ORDER_TYPES
  }
}
