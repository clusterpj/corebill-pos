import { defineStore } from 'pinia'
import { customerModule } from './company/customer'
import { storeModule } from './company/store'
import { cashRegisterModule } from './company/cashRegister'
import { logger } from '../utils/logger'

export const useCompanyStore = defineStore('company', {
  state: () => ({
    ...customerModule.state(),
    ...storeModule.state(),
    ...cashRegisterModule.state(),
    initializationComplete: false
  }),

  getters: {
    ...customerModule.getters,
    ...storeModule.getters,
    ...cashRegisterModule.getters,

    isConfigured: (state) => {
      return state.selectedCustomer && state.selectedStore && state.selectedCashier
    }
  },

  actions: {
    ...customerModule.actions,
    ...storeModule.actions,
    ...cashRegisterModule.actions,

    async initializeFromCashier(cashierData) {
      logger.startGroup('Company Store: Initialize from Cashier')
      try {
        this.clearSelections()
        
        // First fetch all required data
        await this.fetchCustomers()
        logger.debug('Customers fetched')
        
        // Set and persist customer
        await this.setSelectedCustomer(cashierData.customer_id)
        logger.debug('Customer set:', cashierData.customer_id)
        localStorage.setItem('selectedCustomer', cashierData.customer_id)
        
        // Fetch stores for the selected customer
        await this.fetchStores()
        logger.debug('Stores fetched')
        
        // Set and persist store
        await this.setSelectedStore(cashierData.store_id)
        logger.debug('Store set:', cashierData.store_id)
        localStorage.setItem('selectedStore', cashierData.store_id)
        
        // Fetch cash registers for the selected store
        await this.fetchCashRegisters()
        logger.debug('Cash registers fetched')
        
        // Set and persist cashier
        await this.setSelectedCashier(cashierData.id)
        logger.debug('Cashier set:', cashierData.id)
        localStorage.setItem('selectedCashier', cashierData.id)
        
        this.initializationComplete = true
        logger.info('Company store initialized and persisted successfully from cashier')
        
        return true
      } catch (error) {
        logger.error('Failed to initialize from cashier:', error)
        this.clearSelections()
        throw error
      } finally {
        logger.endGroup()
      }
    },

    async initializeStore() {
      logger.startGroup('Company Store: Initialize')
      try {
        // First fetch customers
        await this.fetchCustomers()
        
        const storedCustomer = localStorage.getItem('selectedCustomer')
        const storedStore = localStorage.getItem('selectedStore')
        const storedCashier = localStorage.getItem('selectedCashier')

        if (storedCustomer) {
          await this.setSelectedCustomer(Number(storedCustomer))
          
          // After customer is set, fetch stores
          await this.fetchStores()

          if (storedStore) {
            await this.setSelectedStore(Number(storedStore))
            
            // After store is set, fetch cash registers
            await this.fetchCashRegisters()

            if (storedCashier) {
              await this.setSelectedCashier(Number(storedCashier))
            }
          }
        }

        this.initializationComplete = true
        return true
      } catch (error) {
        logger.error('Store initialization failed:', error)
        this.clearSelections()
        throw error
      } finally {
        logger.endGroup()
      }
    },

    clearSelections() {
      this.selectedCustomer = null
      this.selectedStore = null
      this.selectedCashier = null
      localStorage.removeItem('selectedCustomer')
      localStorage.removeItem('selectedStore')
      localStorage.removeItem('selectedCashier')
      this.initializationComplete = false
    }
  }
})
