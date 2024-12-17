import { logger } from '../../utils/logger'
import { OrderType, PaidStatus } from '../../types/order'

const STORAGE_KEY = 'core_pos_hold_invoices'

export const createOrdersModule = (state, posApi, posOperations) => {
  // Add hold invoice tracking properties to state
  state.currentHoldInvoiceId = null
  state.currentHoldInvoiceDescription = null
  // Initialize hold invoices from localStorage
  const initializeHoldInvoices = () => {
    try {
      const storedInvoices = localStorage.getItem(STORAGE_KEY)
      if (storedInvoices) {
        state.holdInvoices.value = JSON.parse(storedInvoices)
        logger.info('Initialized hold invoices from localStorage:', state.holdInvoices.value.length)
      }
    } catch (error) {
      logger.error('Failed to initialize hold invoices from localStorage:', error)
    }
  }

  // Update localStorage with current hold invoices
  const persistHoldInvoices = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.holdInvoices.value))
      logger.debug('Persisted hold invoices to localStorage')
    } catch (error) {
      logger.error('Failed to persist hold invoices to localStorage:', error)
    }
  }

  const validateHoldInvoiceData = (data) => {
    const required = [
      'items',
      'total',
      'sub_total',
      'due_amount',
      'user_id',
      'store_id',
      'cash_register_id',
      'type',
      'paid_status'
    ]
    
    const missing = required.filter(field => !data[field])
    if (missing.length) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }
    
    if (!Array.isArray(data.items) || !data.items.length) {
      throw new Error('Items array is required and must not be empty')
    }
    
    data.items.forEach((item, index) => {
      if (!item.price || !item.quantity) {
        throw new Error(`Invalid item at index ${index}: missing price or quantity`)
      }
    })

    // Validate type
    if (!Object.values(OrderType).includes(data.type)) {
      throw new Error(`Invalid order type: ${data.type}. Must be one of: ${Object.values(OrderType).join(', ')}`)
    }

    // Validate paid_status
    if (!Object.values(PaidStatus).includes(data.paid_status)) {
      throw new Error(`Invalid paid status: ${data.paid_status}. Must be either PAID or UNPAID`)
    }
  }

  const prepareHoldInvoiceData = (orderData) => {
    const { holdInvoiceSettings } = state
    const currentDate = new Date()
    const dueDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)

    return {
      ...orderData,
      ...holdInvoiceSettings.value.print_settings,
      avalara_bool: holdInvoiceSettings.value.avalara_bool,
      invoice_template_id: holdInvoiceSettings.value.template_id,
      banType: holdInvoiceSettings.value.banType,
      invoice_pbx_modify: holdInvoiceSettings.value.invoice_pbx_modify,
      taxes: holdInvoiceSettings.value.taxes,
      packages: holdInvoiceSettings.value.packages,
      invoice_date: currentDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      items: orderData.items.map(item => ({
        ...item,
        // Prices are already in dollars, convert to cents for API
        price: Math.round(parseFloat(item.price) * 100),
        total: Math.round(parseFloat(item.total) * 100),
        unit_name: item.unit_name || 'N/A',
        discount_type: 'fixed',
        discount: '0.00',
        discount_val: 0,
        sub_total: Math.round(parseFloat(item.total) * 100)
      }))
    }
  }

  const holdOrder = async (orderData) => {
    logger.startGroup('Orders Module: Hold Order')
    state.loading.value.holdInvoices = true
    state.error.value = null

    try {
      validateHoldInvoiceData(orderData)
      const formattedData = prepareHoldInvoiceData(orderData)
      
      logger.debug('Holding order with data:', formattedData)
      const response = await posApi.holdInvoice.create(formattedData)
      
      if (response.success) {
        await fetchHoldInvoices() // Refresh the list
        logger.info('Order held successfully:', response.data)
        return { success: true, data: response.data }
      }
      
      throw new Error(response.message || 'Failed to hold order')
    } catch (error) {
      logger.error('Failed to hold order:', error)
      state.error.value = error.message
      return { success: false, error: error.message }
    } finally {
      state.loading.value.holdInvoices = false
      logger.endGroup()
    }
  }

  const updateHoldInvoice = async (description, orderData) => {
    logger.startGroup('Orders Module: Update Hold Invoice')
    state.loading.value.holdInvoices = true
    state.error.value = null

    try {
      if (!description) {
        throw new Error('Order description is required for update')
      }

      validateHoldInvoiceData(orderData)
      const formattedData = prepareHoldInvoiceData(orderData)
      
      logger.debug('Updating hold invoice with data:', formattedData)
      const response = await posApi.holdInvoice.update(description, {
        ...formattedData,
        print_pdf: false,
        is_invoice_pos: 1,
        is_pdf_pos: true,
        send_email: false,
        save_as_draft: false,
        not_charge_automatically: false,
        package_bool: false,
        invoice_number: "-",
        discount_per_item: "NO",
        tip_type: null,
        tip: 0,
        tip_val: 0,
        tables_selected: [],
        is_hold_invoice: true
      })
      
      if (response.success) {
        await fetchHoldInvoices() // Refresh the list
        logger.info('Hold invoice updated successfully:', response.data)
        return { success: true, data: response.data }
      }
      
      throw new Error(response.message || 'Failed to update hold invoice')
    } catch (error) {
      logger.error('Failed to update hold invoice:', error)
      state.error.value = error.message
      return { success: false, error: error.message }
    } finally {
      state.loading.value.holdInvoices = false
      logger.endGroup()
    }
  }

  const updateHoldInvoicePaidStatus = async (id, paidStatus) => {
    logger.startGroup('Orders Module: Update Hold Invoice Paid Status')
    state.loading.value.holdInvoices = true
    state.error.value = null

    try {
      if (!id) {
        throw new Error('Invoice ID is required')
      }

      if (!Object.values(PaidStatus).includes(paidStatus)) {
        throw new Error(`Invalid paid status: ${paidStatus}. Must be either PAID or UNPAID`)
      }

      const response = await posApi.holdInvoice.updatePaidStatus(id, paidStatus)
      
      if (response.success) {
        await fetchHoldInvoices() // Refresh the list
        logger.info('Hold invoice paid status updated successfully:', { id, paidStatus })
        return { success: true, data: response.data }
      }
      
      throw new Error(response.message || 'Failed to update hold invoice paid status')
    } catch (error) {
      logger.error('Failed to update hold invoice paid status:', error)
      state.error.value = error.message
      return { success: false, error: error.message }
    } finally {
      state.loading.value.holdInvoices = false
      logger.endGroup()
    }
  }

  const fetchHoldInvoices = async () => {
    logger.startGroup('Orders Module: Fetch Hold Invoices')
    state.loading.value.holdInvoices = true
    state.error.value = null

    try {
      const response = await posApi.holdInvoice.getAll()
      if (response.success && response.data?.hold_invoices) {
        state.holdInvoices.value = response.data.hold_invoices.data || []
        persistHoldInvoices() // Persist to localStorage after successful fetch
        logger.info('Hold invoices fetched successfully:', state.holdInvoices.value.length)
        return { success: true, data: state.holdInvoices.value }
      }
      throw new Error(response.message || 'Failed to fetch hold invoices')
    } catch (error) {
      logger.error('Failed to fetch hold invoices:', error)
      state.error.value = error.message
      return { success: false, error: error.message }
    } finally {
      state.loading.value.holdInvoices = false
      logger.endGroup()
    }
  }

  const deleteHoldInvoice = async (id) => {
    logger.startGroup('Orders Module: Delete Hold Invoice')
    state.loading.value.holdInvoices = true
    state.error.value = null

    try {
      const response = await posApi.holdInvoice.delete(id)
      if (response.success) {
        await fetchHoldInvoices() // Refresh the list
        logger.info('Hold invoice deleted successfully:', id)
        return { success: true }
      }
      throw new Error(response.message || 'Failed to delete hold invoice')
    } catch (error) {
      logger.error('Failed to delete hold invoice:', error)
      state.error.value = error.message
      return { success: false, error: error.message }
    } finally {
      state.loading.value.holdInvoices = false
      logger.endGroup()
    }
  }

  // Initialize hold invoices when module is created
  initializeHoldInvoices()

  return {
    holdOrder,
    updateHoldInvoice,
    updateHoldInvoicePaidStatus,
    fetchHoldInvoices,
    deleteHoldInvoice,
    
    setHoldInvoiceId(id) {
      state.currentHoldInvoiceId = id
    },
    
    setHoldInvoiceDescription(description) {
      state.currentHoldInvoiceDescription = description  
    },
    
    clearHoldInvoice() {
      state.currentHoldInvoiceId = null
      state.currentHoldInvoiceDescription = null
    }
  }
}
