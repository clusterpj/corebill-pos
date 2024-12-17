import { apiClient } from '../../services/api/client'
import { logger } from '../../utils/logger'

export const cashRegisterModule = {
  state: () => ({
    cashRegisters: [],
    selectedCashier: null,
    loadingCashRegisters: false,
    cashRegisterError: null,
    lastFetch: null,
    fetchPromise: null
  }),

  getters: {
    hasSelectedCashier: (state) => !!state.selectedCashier,

    currentCashRegister: (state) => {
      return state.cashRegisters.find(register => register.id === state.selectedCashier)
    },

    cashRegistersForDisplay: (state) => {
      return (state.cashRegisters || []).map(register => ({
        title: register.name,
        value: register.id,
        description: register.description,
        storeName: register.store_name,
        customerId: register.customer_id,
        storeId: register.store_id
      }))
    },

    selectedCashierDisplay: (state) => {
      const register = state.cashRegisters.find(r => r.id === state.selectedCashier)
      return register?.name || ''
    }
  },

  actions: {
    async fetchCashRegisters(force = false) {
      // If there's an existing promise and we're not forcing, return it
      if (this.fetchPromise && !force) {
        logger.debug('Using existing cash registers fetch promise')
        return this.fetchPromise
      }

      // Check if we need to fetch based on last fetch time (cache for 5 minutes)
      const now = Date.now()
      if (!force && 
          this.lastFetch && 
          (now - this.lastFetch) < 300000 && 
          this.cashRegisters.length > 0) {
        logger.debug('Using cached cash registers data')
        return Promise.resolve(this.cashRegisters)
      }

      // If already loading, wait for the existing promise
      if (this.loadingCashRegisters) {
        logger.debug('Cash registers fetch already in progress, waiting for completion')
        return this.fetchPromise
      }

      logger.startGroup('Company Store: Fetch Cash Registers')
      this.loadingCashRegisters = true
      this.cashRegisterError = null

      this.fetchPromise = (async () => {
        try {
          const companyId = localStorage.getItem('companyId')
          logger.debug('Fetching cash registers for company:', companyId)

          if (!companyId) {
            throw new Error('Company ID not available')
          }

          const config = {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
              company: companyId
            }
          }

          const response = await apiClient.get('/v1/core-pos/cash-register/getCashRegistersUser', config)

          if (response.data?.success) {
            this.cashRegisters = response.data.data || []
            this.lastFetch = now
            logger.info(`Loaded ${this.cashRegisters.length} cash registers`)
            return this.cashRegisters
          } else {
            throw new Error(response.data?.message || 'Failed to load cash registers')
          }
        } catch (error) {
          logger.error('Failed to fetch cash registers', error)
          this.cashRegisterError = error.message
          this.cashRegisters = []
          throw error
        } finally {
          this.loadingCashRegisters = false
          this.fetchPromise = null
          logger.endGroup()
        }
      })()

      return this.fetchPromise
    },

    async setSelectedCashier(registerId) {
      logger.info('Setting selected cash register:', registerId)
      
      // Ensure cash registers are loaded
      if (this.cashRegisters.length === 0) {
        await this.fetchCashRegisters()
      }
      
      const register = this.cashRegisters.find(r => r.id === Number(registerId))
      if (!register) {
        logger.warn('Cash register not found for ID:', registerId)
        return {
          success: false,
          error: 'Cash register not found'
        }
      }

      this.selectedCashier = Number(registerId)
      localStorage.setItem('selectedCashier', registerId)

      return {
        success: true,
        customerId: register.customer_id,
        storeId: register.store_id
      }
    },

    clearCashierSelection() {
      this.selectedCashier = null
      localStorage.removeItem('selectedCashier')
    }
  }
}