import { defineStore } from 'pinia'
import { useCartStore } from './cart-store'
import { usePosApi } from '../services/api/pos-api'
import { usePosOperations } from '../services/api/pos-operations'
import { useCompanyStore } from './company'
import { logger } from '../utils/logger'

import { createPosState } from './pos/state'
import { createProductsModule } from './pos/products'
import { createOrdersModule } from './pos/orders'
import { createGetters } from './pos/getters'
import { createActions } from './pos/actions'

export const usePosStore = defineStore('pos', () => {
  const cartStore = useCartStore()
  const companyStore = useCompanyStore()
  const posApi = usePosApi()
  const posOperations = usePosOperations()

  // Create state
  const state = createPosState()

  // Create modules
  const productsModule = createProductsModule(state, posApi, companyStore)
  const ordersModule = createOrdersModule(state, posApi, posOperations)
  const getters = createGetters(state, cartStore, companyStore)
  const actions = createActions(state, cartStore)

  // Initialize function
  const initialize = async () => {
    logger.startGroup('POS Store: Initialize')
    try {
      await companyStore.initializeStore()
      await productsModule.fetchCategories()
      await ordersModule.fetchHoldInvoices()
      logger.info('POS Store initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize POS store', error)
      throw error
    } finally {
      logger.endGroup()
    }
  }

  return {
    // State
    ...state,

    // Getters
    ...getters,

    // Actions
    initialize,
    ...actions,
    ...productsModule,
    ...ordersModule
  }
})
