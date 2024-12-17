import { apiClient } from '../../services/api/client'
import { logger } from '../../utils/logger'

export const storeModule = {
  state: () => ({
    stores: [],
    selectedStore: null,
    loadingStores: false,
    storeError: null
  }),

  getters: {
    hasSelectedStore: (state) => !!state.selectedStore,

    currentStore: (state) => {
      return state.stores.find(store => store.id === state.selectedStore)
    },

    storesForDisplay: (state) => {
      return (state.stores || []).map(store => ({
        title: store.name,
        value: store.id,
        description: store.description,
        subtitle: store.company_name
      }))
    },

    selectedStoreDisplay: (state) => {
      const store = state.stores.find(s => s.id === state.selectedStore)
      return store?.name || ''
    }
  },

  actions: {
    async fetchStores(companyId) {
      logger.startGroup('Company Store: Fetch Stores')
      this.loadingStores = true
      this.storeError = null

      try {
        logger.debug('Fetching stores for company:', companyId)

        const params = {
          limit: 10000,
          orderByField: 'name',
          orderBy: 'asc'
        }

        const config = {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            company: companyId
          }
        }

        const response = await apiClient.get('/v1/pos/store', config)

        if (response.data?.success && response.data?.stores?.data) {
          this.stores = response.data.stores.data
          logger.info(`Loaded ${this.stores.length} stores`)
        } else {
          throw new Error(response.data?.message || 'Failed to load stores')
        }
      } catch (error) {
        logger.error('Failed to fetch stores', error)
        this.storeError = error.message
        this.stores = []
      } finally {
        this.loadingStores = false
        logger.endGroup()
      }
    },

    async setSelectedStore(storeId) {
      logger.info('Manual store selection:', storeId)
      
      const store = this.stores.find(s => s.id === storeId)
      if (store) {
        this.selectedStore = storeId
        localStorage.setItem('selectedStore', storeId)
        return true
      } else {
        logger.warn('Store not found for ID:', storeId)
        return false
      }
    },

    clearStoreSelection() {
      this.selectedStore = null
      this.stores = []
      localStorage.removeItem('selectedStore')
    }
  }
}
