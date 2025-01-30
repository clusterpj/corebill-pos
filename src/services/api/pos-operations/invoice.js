import apiClient from '../client'
import { logger } from '../../../utils/logger'
import api from '../pos-api'
import { handleApiError, validateHoldOrder, transformHoldInvoiceResponse, validateTaxData } from './utils'
import { PaidStatus, OrderType } from '../../../types/order'

export const invoiceOperations = {
  async getHoldInvoices() {
    logger.startGroup('POS Operations: Get Hold Invoices')
    try {
      logger.debug('Requesting hold invoices')
      const response = await api.holdInvoice.getAll()
      
      if (!response.data) {
        throw new Error('Invalid hold invoices response')
      }

      // Transform response to include required parameters
      const transformedData = transformHoldInvoiceResponse(response.data)

      // Validate each hold invoice
      if (transformedData.hold_invoices?.data) {
        transformedData.hold_invoices.data.forEach(invoice => {
          try {
            validateHoldOrder(invoice)
          } catch (error) {
            logger.warn(`Invalid hold order ${invoice.id}:`, error.message)
          }
        })
      }

      logger.debug('Hold invoices response:', transformedData)
      logger.info('Hold invoices fetched successfully')
      return {
        success: true,
        ...transformedData
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async getHoldInvoice(id) {
    logger.startGroup('POS Operations: Get Hold Invoice')
    try {
      if (!id) {
        logger.error('Invalid hold invoice ID:', id)
        throw new Error('Hold invoice ID is required')
      }

      logger.debug('Requesting hold invoice:', id)
      const response = await api.holdInvoice.getById(id)
      
      if (!response?.data) {
        logger.error('Empty response from hold invoice API:', response)
        throw new Error('Empty response from hold invoice API')
      }

      // Handle nested response structures
      const invoiceData = response.data?.data || response.data?.hold_invoice || response.data
      
      if (!invoiceData || (!invoiceData.id && !invoiceData.hold_invoice_id)) {
        logger.error('Invalid hold invoice response structure:', response.data)
        throw new Error('Invalid hold invoice response structure')
      }

      // Transform and validate response
      const transformedData = transformHoldInvoiceResponse(invoiceData)
      
      // Ensure critical fields are present
      if (!transformedData.id && !transformedData.hold_invoice_id) {
        logger.error('Missing required ID fields after transform:', transformedData)
        throw new Error('Missing required invoice ID fields')
      }

      logger.debug('Hold invoice response:', transformedData)
      logger.info('Hold invoice fetched successfully')
      return transformedData
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async updateHoldInvoice(id, invoiceData) {
    logger.startGroup('POS Operations: Update Hold Invoice')
    try {
      logger.debug('Updating hold invoice:', { id, data: invoiceData })

      // Set default values if not provided
      const updatedData = {
        ...invoiceData,
        paid_status: invoiceData.paid_status || PaidStatus.UNPAID,
        type: invoiceData.type || OrderType.DINE_IN,
        is_hold_invoice: true,
        // Ensure taxes array is properly formatted
        taxes: Array.isArray(invoiceData.taxes) ? invoiceData.taxes.map(tax => ({
          ...tax,
          tax_type_id: Number(tax.tax_type_id),
          company_id: Number(tax.company_id),
          amount: Number(tax.amount),
          percent: Number(tax.percent || 0),
          compound_tax: Number(tax.compound_tax || 0)
        })) : []
      }

      // Validate parameters if present
      if (updatedData.paid_status && !Object.values(PaidStatus).includes(updatedData.paid_status)) {
        throw new Error('Invalid paid_status. Must be either PAID or UNPAID')
      }

      if (updatedData.type && !Object.values(OrderType).includes(updatedData.type)) {
        throw new Error('Invalid type. Must be one of: DINE IN, TO-GO, DELIVERY, PICKUP')
      }

      const response = await api.holdInvoice.update(id, updatedData)

      logger.debug('Hold invoice update response:', response)
      logger.info('Hold invoice updated successfully:', {
        invoiceId: id,
        total: updatedData.total,
        paid_status: updatedData.paid_status,
        type: updatedData.type
      })

      return {
        success: true,
        data: transformHoldInvoiceResponse(response.data)
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async createInvoice(invoiceData) {
    logger.startGroup('POS Operations: Create Invoice')
    try {
      logger.debug('Creating invoice with data:', invoiceData)

      // Ensure taxes are properly formatted and validated
      const updatedData = {
        ...invoiceData,
        paid_status: invoiceData.paid_status || PaidStatus.UNPAID,
        type: invoiceData.type || OrderType.DINE_IN,
        // Ensure taxes array is properly formatted
        taxes: Array.isArray(invoiceData.taxes) 
          ? invoiceData.taxes.map(validateTaxData)
          : []
      }

      // Log tax information for debugging
      logger.debug('Tax information:', {
        totalTax: updatedData.tax,
        taxesArray: updatedData.taxes,
        validateStatus: updatedData.taxes.every(tax => 
          tax.tax_type_id && tax.company_id && !isNaN(tax.amount)
        )
      })

      // Validate parameters if present
      if (updatedData.paid_status && !Object.values(PaidStatus).includes(updatedData.paid_status)) {
        throw new Error('Invalid paid_status. Must be either PAID or UNPAID')
      }

      if (updatedData.type && !Object.values(OrderType).includes(updatedData.type)) {
        throw new Error('Invalid type. Must be one of: DINE IN, TO-GO, DELIVERY, PICKUP')
      }

      // Skip hold invoice validation if we're creating from prepared data
      if (updatedData.hold_invoice_id && !updatedData.is_prepared_data) {
        const holdOrder = await this.getHoldInvoice(updatedData.hold_invoice_id)
        if (!holdOrder) {
          throw new Error('Failed to fetch hold invoice')
        }
        validateHoldOrder(holdOrder)
      }

      const response = await apiClient.post('invoices', updatedData)

      logger.debug('Invoice creation response:', response.data)
      logger.info('Invoice created successfully:', {
        invoiceId: response.data.invoice?.id,
        total: response.data.invoice?.total,
        paid_status: updatedData.paid_status,
        type: updatedData.type
      })
      
      return {
        success: true,
        ...transformHoldInvoiceResponse(response.data)
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async getInvoice(id) {
    logger.startGroup('POS Operations: Get Invoice')
    try {
      logger.debug('Requesting invoice:', id)
      const response = await apiClient.get(`invoices/${id}`)
      
      if (!response.data?.invoice) {
        throw new Error('Invalid invoice response')
      }

      logger.debug('Invoice response:', response.data)
      logger.info('Invoice fetched successfully')
      return {
        success: true,
        ...transformHoldInvoiceResponse(response.data.invoice)
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  }
}

export default invoiceOperations
