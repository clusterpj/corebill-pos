import apiClient from '../client'
import { logger } from '../../../utils/logger'
import { getApiEndpoint } from '../config'
import { handleApiError } from './utils'

export const configOperations = {
  async getCompanySettings() {
    logger.startGroup('POS Operations: Get Company Settings')
    try {
      const settings = [
        'invoice_auto_generate',
        'invoice_issuance_period',
        'payment_auto_generate',
        'allow_invoice_form_pos',
        'allow_partial_pay',
        'pdf_format_pos'
      ]

      logger.debug('Requesting company settings with params:', { settings })

      const response = await apiClient.get('company/settings', {
        params: { 'settings[]': settings }
      })

      logger.debug('Company settings response:', response.data)
      logger.info('Company settings fetched successfully')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async getNextNumber(type) {
    logger.startGroup(`POS Operations: Get Next ${type} Number`)
    try {
      logger.debug(`Requesting next ${type} number`)
      const response = await apiClient.get('next-number', {
        params: { key: type }
      })
      
      if (!response.data.nextNumber || !response.data.prefix) {
        throw new Error('Invalid next number response')
      }

      logger.debug(`Next ${type} number response:`, response.data)
      logger.info(`Next ${type} number fetched successfully`)
      
      return {
        nextNumber: response.data.nextNumber,
        prefix: response.data.prefix
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async getTables(cashRegisterId) {
    logger.startGroup('POS Operations: Get Tables')
    try {
      if (!cashRegisterId) {
        throw new Error('Cash register ID is required')
      }

      logger.debug('Requesting tables for cash register:', cashRegisterId)
      const companyId = localStorage.getItem('companyId')
      const endpoint = `${getApiEndpoint('pos.tables')}/${cashRegisterId}`
      
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          company: companyId
        }
      }

      logger.debug('Tables request config:', { endpoint, config })
      const response = await apiClient.get(endpoint, config)
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid response structure')
      }

      // Ensure we have a data array, even if empty
      const tables = Array.isArray(response.data) ? response.data : 
                    (response.data.data && Array.isArray(response.data.data)) ? response.data.data : 
                    []

      logger.debug('Tables response processed:', {
        rawResponse: response.data,
        processedTables: tables,
        tableCount: tables.length
      })

      return {
        success: true,
        data: tables.map(table => ({
          id: table.id,
          name: table.name || `Table ${table.id}`,
          is_occupied: !!table.is_occupied,
          quantity: table.quantity || 0,
          items: table.items || 0
        }))
      }
    } catch (error) {
      logger.error('Failed to fetch tables', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        cashRegisterId
      })
      return {
        success: false,
        error: error.message,
        data: []
      }
    } finally {
      logger.endGroup()
    }
  }
}

export default configOperations
