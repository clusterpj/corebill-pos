import apiClient from './client'
import { logger } from '../../utils/logger'

export const taxTypesApi = {
    async getTaxTypes() {
        console.log('Fetching tax types...')
        try {
            const response = await apiClient.get('tax-types', {
                params: {
                    limit: 500
                },
                headers: {
                    'company': '1'
                }
            })
            
            console.log('API Response:', response)
            console.log('Response data:', response.data)
            
            // Properly extract data from the nested response
            const taxTypes = response.data?.taxTypes?.data || []
            
            console.log('Extracted tax types:', taxTypes)
            logger.debug('Tax types fetched:', taxTypes)
            return taxTypes
        } catch (error) {
            console.error('Error fetching tax types:', error)
            throw error
        }
    }
}

export default taxTypesApi
