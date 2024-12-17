import { ref, computed } from 'vue'
import { apiClient } from '../../../services/api/client'
import { logger } from '../../../utils/logger'
import debounce from 'lodash/debounce'

export function useCustomerSearch() {
  const searchResults = ref([])
  const isSearching = ref(false)
  const searchError = ref(null)
  const lastSearchQuery = ref('')
  
  // Debounced search function
  const searchCustomers = debounce(async (query) => {
    if (!query || query.length < 3) {
      searchResults.value = []
      searchError.value = null
      return
    }

    // Don't search if query hasn't changed
    if (query === lastSearchQuery.value) return
    
    lastSearchQuery.value = query

    isSearching.value = true
    searchError.value = null

    try {
      const response = await apiClient.get('/v1/customers', {
        params: {
          search: query,
          status_customer: 'A',
          orderByField: 'created_at',
          orderBy: 'desc',
          page: 1
        }
      })

      if (response.data?.customers?.data) {
        searchResults.value = response.data.customers.data.map(customer => {
          // Format phone number if present
          const formattedPhone = customer.phone ? customer.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1$2$3') : 'No phone'
          
          return {
            title: customer.name,
            subtitle: `${formattedPhone} • ${customer.email || ''}`,
            value: customer
          }
        })
      }
    } catch (error) {
      logger.error('Customer search failed:', error)
      searchError.value = 'Failed to search customers'
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 350)

  const createCustomer = async (customerData) => {
    try {
      const response = await apiClient.post('/v2/core-pos/customer', customerData)
      return response.data
    } catch (error) {
      logger.error('Customer creation failed:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create customer'
      throw new Error(errorMessage)
    }
  }

  return {
    searchResults,
    isSearching,
    searchError,
    searchCustomers,
    createCustomer
  }
}
