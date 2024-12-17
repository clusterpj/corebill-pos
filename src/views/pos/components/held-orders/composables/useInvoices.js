import { ref, computed } from 'vue'
import { apiClient } from '../../../../../services/api/client'
import { handleApiError } from '../../../../../services/api/pos-operations/utils'
import { logger } from '../../../../../utils/logger'

export function useInvoices() {
  const loading = ref(false)
  const invoices = ref([])
  const error = ref(null)
  const pagination = ref({
    total: 0,
    currentPage: 1,
    lastPage: 1
  })

  const fetchInvoices = async ({
    customerId = '',
    status = '',
    fromDate = '',
    toDate = '',
    invoiceNumber = '',
    customcode = '',
    unit = '',
    orderByField = 'invoice_number',
    orderBy = 'desc',
    limit = 'all',
    page = 1
  } = {}) => {
    loading.value = true
    error.value = null

    try {
      logger.debug('Fetching invoices with params:', {
        customerId,
        status,
        fromDate,
        toDate,
        invoiceNumber,
        customcode,
        unit,
        orderByField,
        orderBy,
        limit,
        page
      })

      const response = await apiClient.get(`invoices`, {
        params: {
          is_invoice_pos: 1,
          customer_id: customerId,
          status,
          from_date: fromDate,
          to_date: toDate,
          invoice_number: invoiceNumber,
          customcode,
          unit,
          orderByField,
          orderBy,
          v2: true,
          page
        }
      })
      
      logger.debug('Raw API response:', {
        status: response?.status,
        hasData: !!response?.data,
        dataStructure: {
          hasInvoices: !!response?.data?.invoices,
          hasInvoicesData: !!response?.data?.invoices?.data,
          invoicesDataType: typeof response?.data?.invoices?.data
        }
      })

      // Extract invoices and pagination data from the response
      const { data: invoiceData, total, current_page, last_page } = response?.data?.invoices || {}
      
      logger.debug('Extracted API response data:', {
        total,
        currentPage: current_page,
        lastPage: last_page,
        dataCount: invoiceData?.length,
        sample: invoiceData?.[0] ? {
          id: invoiceData[0].id,
          invoice_number: invoiceData[0].invoice_number,
          status: invoiceData[0].status,
          paid_status: invoiceData[0].paid_status
        } : null
      })

      // Update pagination info
      pagination.value = {
        total: total || 0,
        currentPage: current_page || 1,
        lastPage: last_page || 1
      }

      invoices.value = (invoiceData || []).map(invoice => ({
        ...invoice,
        // Ensure required fields exist
        invoice_number: invoice.invoice_number || '-',
        status: invoice.status || 'PENDING',
        paid_status: invoice.paid_status || 'UNPAID',
        total: Number(invoice.total || 0),
        customer: invoice.customer || { name: 'Walk-in Customer' }
      }))
      
      logger.info('Invoices fetched successfully:', {
        total: invoices.value.length,
        firstInvoice: invoices.value[0]?.id
      })
      return { success: true, data: invoices.value }
    } catch (err) {
      const errorResponse = handleApiError(err)
      error.value = errorResponse.message
      logger.error('Failed to fetch invoices:', {
        error: errorResponse,
        params: params
      })
      return { 
        success: false, 
        message: errorResponse.message || 'Failed to fetch invoices',
        errors: errorResponse.errors || {}
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    invoices,
    error,
    pagination,
    fetchInvoices
  }
}
