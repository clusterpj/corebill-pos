import { apiClient } from '../../services/api/client'
import { logger } from '../../utils/logger'

export const customerModule = {
  state: () => ({
    customers: [],
    selectedCustomer: null,
    loading: false,
    error: null,
    lastFetch: null,
    fetchPromise: null
  }),

  getters: {
    hasSelectedCustomer: (state) => !!state.selectedCustomer,
    
    currentCustomer: (state) => {
      return state.customers.find(customer => customer.id === state.selectedCustomer)
    },

    customersForDisplay: (state) => {
      return (state.customers || [])
        .filter(customer => customer.status_customer === 'A')
        .map(customer => ({
          title: customer.name,
          value: customer.id,
          companyId: customer.company_id
        }))
    },

    selectedCustomerDisplay: (state) => {
      const customer = state.customers.find(c => c.id === state.selectedCustomer)
      return customer?.name || ''
    }
  },

  actions: {
    async fetchCustomers(force = false) {
      // If there's an existing promise and we're not forcing, return it
      if (this.fetchPromise && !force) {
        logger.debug('Using existing fetch promise')
        return this.fetchPromise
      }

      // Check if we need to fetch based on last fetch time (cache for 5 minutes)
      const now = Date.now()
      if (!force && 
          this.lastFetch && 
          (now - this.lastFetch) < 300000 && 
          this.customers.length > 0) {
        logger.debug('Using cached customers data')
        return Promise.resolve(this.customers)
      }

      // If already loading, wait for the existing promise
      if (this.loading) {
        logger.debug('Fetch already in progress, waiting for completion')
        return this.fetchPromise
      }

      logger.startGroup('Company Store: Fetch Customers')
      this.loading = true
      this.error = null

      // Create and store the fetch promise
      this.fetchPromise = (async () => {
        try {
          const response = await apiClient.get('customers', {
            params: { 
              limit: 'all',
              include: 'addresses,contacts,details,state,address_fields',
              fields: 'id,name,phone,email,address_street_1,address_street_2,city,state,zip,state_id,notes'
            }
          })
          
          if (response.data?.customers?.data) {
            this.customers = response.data.customers.data
            this.lastFetch = now
            logger.info(`Loaded ${this.customers.length} customers`)
            return this.customers
          } else {
            throw new Error('Invalid response format: missing customers data')
          }
        } catch (error) {
          logger.error('Failed to fetch customers', error)
          this.error = error.message
          this.customers = []
          throw error
        } finally {
          this.loading = false
          this.fetchPromise = null
          logger.endGroup()
        }
      })()

      return this.fetchPromise
    },

    async setSelectedCustomer(customerId) {
      logger.info('Manual customer selection:', customerId)
      
      // Ensure customers are loaded
      if (this.customers.length === 0) {
        await this.fetchCustomers()
      }
      
      const customer = this.customers.find(c => c.id === customerId)
      if (customer) {
        this.selectedCustomer = customerId
        localStorage.setItem('selectedCustomer', customerId)
        localStorage.setItem('companyId', customer.company_id)
        return customer.company_id
      } else {
        logger.warn('Customer not found for ID:', customerId)
        return null
      }
    },

    clearCustomerSelection() {
      this.selectedCustomer = null
      localStorage.removeItem('selectedCustomer')
      localStorage.removeItem('companyId')
    }
  }
}
