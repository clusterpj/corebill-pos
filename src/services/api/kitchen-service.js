import { apiClient } from './client'
import { errorHandler } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'

export class KitchenService {
  static async fetchOrders(sectionId) {
    try {
      const response = await apiClient.get(`/v1/core-pos/sections/getorders/${sectionId}`)
      logger.debug('[KitchenService] Fetched orders:', response.data)
      return response.data?.data || []
    } catch (error) {
      throw errorHandler.handleApi(error, '[KitchenService] fetchOrders')
    }
  }

  static async updateOrderStatus(orderId, status) {
    try {
      const response = await apiClient.put(`/v1/core-pos/orders/${orderId}/status`, { status })
      logger.debug(`[KitchenService] Updated order ${orderId} status:`, response.data)
      return response.data
    } catch (error) {
      throw errorHandler.handleApi(error, '[KitchenService] updateOrderStatus')
    }
  }

  static async fetchOrderDetails(orderId) {
    try {
      const response = await apiClient.get(`/v1/core-pos/orders/${orderId}`)
      logger.debug(`[KitchenService] Fetched order details for ${orderId}:`, response.data)
      return response.data
    } catch (error) {
      throw errorHandler.handleApi(error, '[KitchenService] fetchOrderDetails')
    }
  }
}
