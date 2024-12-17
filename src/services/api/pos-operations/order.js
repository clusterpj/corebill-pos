import apiClient from '../client'
import { logger } from '../../../utils/logger'
import { handleApiError } from './utils'

export const orderOperations = {
  async getOrders() {
    logger.startGroup('POS Operations: Get Orders')
    try {
      logger.debug('Requesting orders')
      const response = await apiClient.get('orders')
      
      if (!response.data) {
        throw new Error('Invalid orders response')
      }

      logger.debug('Orders response:', response.data)
      logger.info('Orders fetched successfully')
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : response.data.data || []
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async getOrderById(orderId) {
    logger.startGroup('POS Operations: Get Order By ID')
    try {
      logger.debug('Requesting order:', orderId)
      const response = await apiClient.get(`orders/${orderId}`)
      
      if (!response.data) {
        throw new Error('Invalid order response')
      }

      logger.debug('Order response:', response.data)
      logger.info('Order fetched successfully')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async updateOrderStatus(orderId, statusData) {
    logger.startGroup('POS Operations: Update Order Status')
    try {
      logger.debug('Updating order status:', { orderId, statusData })

      const response = await apiClient.patch(`orders/${orderId}/status`, statusData)

      logger.debug('Order status update response:', response.data)
      logger.info('Order status updated successfully:', {
        orderId,
        newStatus: statusData.status
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  }
}

export default orderOperations
