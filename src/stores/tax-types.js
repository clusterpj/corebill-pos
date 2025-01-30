import { defineStore } from 'pinia'
import { taxTypesApi } from '../services/api/tax-types'
import { logger } from '../utils/logger'

export const useTaxTypesStore = defineStore('taxTypes', {
    state: () => ({
        taxTypes: [],
        loading: false,
        error: null,
        lastFetch: null
    }),

    getters: {
        availableTaxTypes: (state) => {
            console.log('Getting available tax types, current state:', state.taxTypes)
            const available = state.taxTypes.filter(tax => tax.status === 'A')
            console.log('Filtered available tax types:', available)
            logger.debug('Available tax types:', available)
            return available
        }
    },

    actions: {
        async fetchTaxTypes() {
            console.log('fetchTaxTypes called, lastFetch:', this.lastFetch)
            // Don't fetch if we've fetched recently (within 5 minutes)
            if (this.lastFetch && (Date.now() - this.lastFetch) < 300000) {
                console.log('Skipping fetch - data was recently loaded')
                return
            }

            console.log('Starting to fetch tax types...')
            this.loading = true
            this.error = null
            
            try {
                console.log('Making API call to getTaxTypes...')
                const data = await taxTypesApi.getTaxTypes()
                console.log('Raw API response:', data)

                this.taxTypes = data.map(tax => ({
                    ...tax,
                    // Ensure percent is stored as actual decimal for calculations
                    // e.g., 0.55 for 0.55%
                    percent: Number(tax.percent),
                    id: Number(tax.id),
                    company_id: Number(tax.company_id)
                }))
                console.log('Processed tax types:', this.taxTypes)
                
                this.lastFetch = Date.now()
                logger.info('Tax types loaded:', {
                    count: this.taxTypes.length,
                    taxes: this.taxTypes.map(t => ({ 
                        id: t.id, 
                        name: t.name, 
                        percent: `${t.percent}%` 
                    }))
                })
            } catch (error) {
                console.error('Error in fetchTaxTypes:', error)
                this.error = error.message
                logger.error('Failed to load tax types:', error)
            } finally {
                console.log('fetchTaxTypes completed, loading set to false')
                this.loading = false
            }
        }
    }
})
