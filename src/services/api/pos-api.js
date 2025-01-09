import apiClient from './client'
import { logger } from '../../utils/logger'
import { getApiEndpoint } from './config'

/**
 * Required settings for POS operations
 */
const REQUIRED_SETTINGS = [
  'allow_invoice_form_pos',
  'pdf_format_pos',
  'default_email',
  'tax_per_item',
  'discount_per_item',
  'retention_active',
  'invoice_auto_generate',
  'invoice_issuance_period',
  'payment_auto_generate',
  'allow_partial_pay',
  'footer_text_value',
  'footer_url_value',
  'footer_url_name',
  'autoprint_pdf_pos',
  'current_year',
  'activate_pay_button'
]

/**
 * Get next number from API
 * @param {string} key - Type of number to generate (invoice, payment, etc.)
 * @returns {Promise<Object>} Next number response
 */
async function getNextNumber(key) {
  logger.startGroup(`POS API: Get Next ${key} Number`)
  try {
    const endpoint = getApiEndpoint('nextNumber')
    logger.info(`Fetching next ${key} number from endpoint:`, endpoint)
    
    const response = await apiClient.get(endpoint, { params: { key } })
    logger.debug(`Next ${key} number response:`, response.data)
    
    // Validate response format
    if (!response.data?.nextNumber || !response.data?.prefix) {
      throw new Error(`Invalid next ${key} number response format`)
    }
    
    return {
      number: `${response.data.prefix}${response.data.nextNumber}`,
      nextNumber: response.data.nextNumber,
      prefix: response.data.prefix
    }
  } catch (error) {
    logger.error(`Failed to get next ${key} number`, error)
    throw new Error(`Failed to get next ${key} number: ${error.message}`)
  } finally {
    logger.endGroup()
  }
}

/**
 * POS API Service
 * Implements endpoints from CorePOS API Implementation Guide
 */
const operations = {
  // Settings Management
  async getCompanySettings() {
    logger.startGroup('POS API: Get Company Settings')
    try {
      const endpoint = getApiEndpoint('pos.settings')
      logger.info('Fetching company settings from endpoint:', endpoint)
      
      // Prepare settings parameter
      const params = {
        settings: REQUIRED_SETTINGS
      }
      
      const response = await apiClient.get(endpoint, { params })
      logger.debug('Company settings response:', response.data)
      
      return response.data
    } catch (error) {
      logger.error('Failed to fetch company settings', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  // User Management
  async getEmployees() {
    logger.startGroup('POS API: Get Employees')
    try {
      const endpoint = getApiEndpoint('pos.employees')
      logger.info('Fetching employees from endpoint:', endpoint)
      
      const response = await apiClient.get(endpoint)
      logger.http('GET', endpoint, {}, response)

      if (!response.data) {
        throw new Error('Invalid response format: missing data')
      }

      return {
        success: true,
        employees: response.data
      }
    } catch (error) {
      logger.error('Failed to fetch employees', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  // Cash Register Management
  async getCashiers() {
    logger.startGroup('POS API: Get Cashiers')
    try {
      const endpoint = getApiEndpoint('pos.cashiers')
      logger.info('Fetching cashiers from endpoint:', endpoint)
      
      const response = await apiClient.get(endpoint)
      logger.http('GET', endpoint, {}, response)
      
      if (!response.data) {
        throw new Error('Invalid response format: missing data')
      }

      return {
        success: true,
        cashiers: response.data
      }
    } catch (error) {
      logger.error('Failed to fetch cashiers', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  // Product Management
  async getItems(params = {}) {
    logger.startGroup('POS API: Get Items')
    try {
      const endpoint = getApiEndpoint('pos.items')
      logger.info('Fetching items from endpoint:', endpoint)
      logger.debug('Request parameters', params)

      // Set default pagination if not provided
      const pagination = {
        limit: params.limit || 100,
        page: params.page || 1
      }

      const response = await apiClient.get(endpoint, { 
        params: {
          ...params,
          ...pagination
        }
      })
      logger.http('GET', endpoint, { params }, response)

      if (!response.data) {
        throw new Error('Invalid response format: missing data')
      }

      return {
        items: {
          data: response.data.data || [],
          itemTotalCount: response.data.total || 0
        },
        itemTotalCount: response.data.total || 0
      }
    } catch (error) {
      logger.error('Failed to fetch items', {
        error,
        endpoint: getApiEndpoint('pos.items'),
        params
      })
      throw error
    } finally {
      logger.endGroup()
    }
  },

  async createItem(itemData) {
    logger.startGroup('POS API: Create Item')
    try {
      const endpoint = getApiEndpoint('pos.items')
      logger.info('Creating item at endpoint:', endpoint)
      logger.debug('Item data:', itemData)

      const response = await apiClient.post(endpoint, itemData)
      logger.http('POST', endpoint, { data: itemData }, response)

      if (!response.data) {
        throw new Error('Invalid response format: missing data')
      }

      return response.data
    } catch (error) {
      logger.error('Failed to create item', {
        error,
        endpoint: getApiEndpoint('pos.items'),
        itemData
      })
      throw error
    } finally {
      logger.endGroup()
    }
  },

  async updateItem(itemId, itemData) {
    logger.startGroup('POS API: Update Item')
    try {
      const endpoint = `${getApiEndpoint('pos.items')}/${itemId}`
      logger.info('Updating item at endpoint:', endpoint)
      logger.debug('Item data:', itemData)

      const response = await apiClient.put(endpoint, itemData)
      logger.http('PUT', endpoint, { data: itemData }, response)

      if (!response.data) {
        throw new Error('Invalid response format: missing data')
      }

      return response.data
    } catch (error) {
      logger.error('Failed to update item', {
        error,
        endpoint: getApiEndpoint('pos.items'),
        itemId,
        itemData
      })
      throw error
    } finally {
      logger.endGroup()
    }
  },

  async getItemCategories() {
    logger.startGroup('POS API: Get Item Categories')
    try {
      const endpoint = getApiEndpoint('pos.categories')
      logger.info('Fetching item categories from endpoint:', endpoint)
      
      const response = await apiClient.get(endpoint)
      logger.http('GET', endpoint, {}, response)

      if (!response.data) {
        throw new Error('Invalid response format: missing data')
      }

      if (response.data.success === true) {
        const categories = response.data.data || []
        logger.info(`Categories fetched successfully. Count: ${categories.length}`)
        logger.debug('Categories:', categories)
        return {
          success: true,
          data: categories
        }
      } else {
        logger.warn('Unexpected API response structure', response.data)
        return {
          success: false,
          data: [],
          error: 'Invalid API response format'
        }
      }
    } catch (error) {
      logger.error('Failed to fetch categories', {
        error,
        endpoint: getApiEndpoint('pos.categories')
      })
      throw error
    } finally {
      logger.endGroup()
    }
  },

  // Store Management
  async getStores() {
    logger.startGroup('POS API: Get Stores')
    try {
      const endpoint = getApiEndpoint('pos.store')
      logger.info('Fetching stores from endpoint:', endpoint)

      const params = {
        limit: 10000,
        orderByField: 'name',
        orderBy: 'asc'
      }

      const response = await apiClient.get(endpoint, { params })
      logger.http('GET', endpoint, { params }, response)

      if (!response.data) {
        throw new Error('Invalid response format: missing data')
      }

      return {
        success: true,
        stores: response.data
      }
    } catch (error) {
      logger.error('Failed to fetch stores', {
        error,
        endpoint: getApiEndpoint('pos.store')
      })
      throw error
    } finally {
      logger.endGroup()
    }
  },

  // Invoice Operations
  invoice: {
    async getNextNumber() {
      const response = await getNextNumber('invoice')
      return {
        invoice_number: response.number,
        nextNumber: response.nextNumber,
        prefix: response.prefix
      }
    },

    async create(invoiceData) {
      logger.startGroup('POS API: Create Invoice')
      try {
        const endpoint = getApiEndpoint('pos.invoice.create')
        logger.info('Creating invoice at endpoint:', endpoint)
        logger.debug('Invoice data:', invoiceData)

        const response = await apiClient.post(endpoint, invoiceData)
        logger.debug('Invoice creation response:', response.data)

        return response.data
      } catch (error) {
        logger.error('Failed to create invoice', error)
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async getById(id) {
      logger.startGroup('POS API: Get Invoice')
      try {
        const endpoint = `${getApiEndpoint('pos.invoice.get')}/${id}`
        logger.info('Fetching invoice from endpoint:', endpoint)
        
        const response = await apiClient.get(endpoint)
        logger.debug('Invoice response:', response.data)
        
        return response.data
      } catch (error) {
        logger.error('Failed to get invoice', error)
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async getAll(params = {}) {
      logger.startGroup('POS API: Get All Invoices')
      try {
        const endpoint = getApiEndpoint('pos.invoice.getAll')
        logger.info('Fetching invoices from endpoint:', endpoint)
        
        const response = await apiClient.get(endpoint, { params })
        logger.debug('Invoices response:', response.data)
        
        return {
          success: true,
          data: response.data.invoices || []
        }
      } catch (error) {
        logger.error('Failed to fetch invoices', error)
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async update(id, invoiceData) {
      logger.startGroup('POS API: Update Invoice')
      try {
        const endpoint = `invoices/${id}`
        logger.info('Updating invoice at endpoint:', endpoint)
        
        // Format the data according to API requirements
        const formattedData = {
          ...invoiceData,
          id: Number(id),
          is_edited: 1,
          status: 'DRAFT',
          is_invoice_pos: 1,
          is_pdf_pos: true,
          banType: true,
          avalara_bool: false,
          package_bool: 0,
          save_as_draft: 0,
          not_charge_automatically: 0
        }

        logger.debug('Formatted invoice update data:', formattedData)
        
        // Format the data according to API requirements
        const updateData = {
          ...formattedData,
          id: Number(id),
          is_edited: 1,
          status: 'DRAFT',
          is_invoice_pos: 1,
          is_pdf_pos: true,
          banType: true,
          avalara_bool: false,
          package_bool: 0,
          save_as_draft: 0,
          not_charge_automatically: 0,
          items: formattedData.items.map(item => ({
            ...item,
            price: Math.round(Number(item.price * 100)),
            sub_total: Math.round(Number(item.sub_total * 100)),
            total: Math.round(Number(item.total * 100)),
            tax: Math.round(Number(item.tax * 100))
          }))
        }

        const response = await apiClient.put(endpoint, updateData)
        logger.debug('Invoice update response:', response.data)
        
        return response.data
      } catch (error) {
        logger.error('Failed to update invoice', error)
        throw error
      } finally {
        logger.endGroup()
      }
    }
  },

  // Payment Operations
  payment: {
    async getMethods() {
      logger.startGroup('POS API: Get Payment Methods')
      try {
        const endpoint = getApiEndpoint('pos.payment.methods')
        logger.info('Fetching payment methods from endpoint:', endpoint)
        
        const response = await apiClient.get(endpoint)
        logger.debug('Payment methods response:', response.data)
        
        return response.data
      } catch (error) {
        logger.error('Failed to get payment methods', error)
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async getNextNumber() {
      const response = await getNextNumber('payment')
      return {
        payment_number: response.number,
        nextNumber: response.nextNumber,
        prefix: response.prefix
      }
    },

    async create(paymentData) {
      logger.startGroup('POS API: Create Payment')
      try {
        const endpoint = getApiEndpoint('pos.payment.create')
        logger.info('Creating payment at endpoint:', endpoint)
        logger.debug('Payment data:', paymentData)

        const response = await apiClient.post(endpoint, paymentData)
        logger.debug('Payment creation response:', response.data)

        return response.data
      } catch (error) {
        logger.error('Failed to create payment', error)
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async getById(id) {
      logger.startGroup('POS API: Get Payment')
      try {
        const endpoint = `${getApiEndpoint('pos.payment.get')}/${id}`
        logger.info('Fetching payment from endpoint:', endpoint)
        
        const response = await apiClient.get(endpoint)
        logger.debug('Payment response:', response.data)
        
        return response.data
      } catch (error) {
        logger.error('Failed to get payment', error)
        throw error
      } finally {
        logger.endGroup()
      }
    }
  },

  // Hold Invoice Operations
  holdInvoice: {
    async create(invoiceData) {
      logger.startGroup('POS API: Create Hold Invoice')
      try {
        const endpoint = getApiEndpoint('pos.holdInvoices')
        logger.info('Creating hold invoice at endpoint:', endpoint)
        logger.debug('Hold invoice data:', invoiceData)

        const response = await apiClient.post(endpoint, invoiceData)
        logger.debug('Hold invoice response:', response.data)

        return response.data
      } catch (error) {
        logger.error('Failed to create hold invoice', error)
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async update(description, invoiceData) {
      logger.startGroup('POS API: Update Hold Invoice')
      try {
        const endpoint = getApiEndpoint('pos.holdInvoices')
        logger.info(`Updating hold invoice with description: ${description}`)
        logger.debug('Hold invoice update data:', invoiceData)

        const response = await apiClient.post(endpoint, {
          ...invoiceData,
          description,
          is_hold_invoice: true
        })
        logger.debug('Hold invoice update response:', response.data)

        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        logger.error('Failed to update hold invoice', error)
        return {
          success: false,
          error: error.message,
          message: 'Failed to update hold invoice'
        }
      } finally {
        logger.endGroup()
      }
    },

    async getAll() {
      logger.startGroup('POS API: Get All Hold Invoices')
      try {
        const endpoint = getApiEndpoint('pos.holdInvoices')
        const response = await apiClient.get(endpoint)
        logger.debug('Hold invoices response:', response.data)
        
        return {
          success: true,
          data: {
            hold_invoices: response.data.hold_invoices
          }
        }
      } catch (error) {
        logger.error('Failed to fetch hold invoices', error)
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async getById(id) {
      logger.startGroup('POS API: Get Hold Invoice')
      try {
        const endpoint = `${getApiEndpoint('pos.holdInvoices')}/${id}`
        const response = await apiClient.get(endpoint)
        logger.debug('Hold invoice response:', response.data)
        return response.data
      } catch (error) {
        logger.error('Failed to fetch hold invoice', error)
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async delete(id) {
      logger.startGroup('POS API: Delete Hold Invoice')
      try {
        if (!id) {
          throw new Error('Hold invoice ID is required')
        }

        const endpoint = getApiEndpoint('pos.holdInvoiceDelete')
        logger.info('Deleting hold invoice at endpoint:', endpoint)
        logger.debug('Delete hold invoice ID:', id)
        
        const response = await apiClient.post(endpoint, { id })
        logger.debug('Delete response:', response.data)

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to delete hold invoice')
        }

        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        logger.error('Failed to delete hold invoice', error)
        return {
          success: false,
          error: error.message,
          message: 'Failed to delete hold invoice'
        }
      } finally {
        logger.endGroup()
      }
    }
  }
}

// Export both the composable-style function and the direct operations object
export const usePosApi = () => operations
export const posApi = operations
export default operations
