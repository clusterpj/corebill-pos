import { apiClient } from './client'
import { errorHandler } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'

export class BarService {
  static async fetchOrders(sectionId) {
    try {
      // Fetch orders with details in a single request
      const response = await apiClient.get(`/v1/core-pos/sections/getorders/${sectionId}`, {
        params: {
          include: ['items', 'details', 'status'],
          section_type: 'bar'
        }
      })
      logger.debug('[BarService] Fetched orders with details:', response.data)
      return response.data?.data || []
    } catch (error) {
      throw errorHandler.handleApi(error, '[BarService] fetchOrders')
    }
  }

  static async updateOrderStatus(orderIds, status) {
    try {
      // Batch update multiple orders at once
      const response = await apiClient.put(`/v1/core-pos/orders/batch/status`, {
        order_ids: Array.isArray(orderIds) ? orderIds : [orderIds],
        status
      })
      logger.debug(`[BarService] Batch updated orders status:`, response.data)
      return response.data
    } catch (error) {
      throw errorHandler.handleApi(error, '[BarService] updateOrderStatus')
    }
  }

  static async fetchOrdersDetails(orderIds) {
    try {
      const response = await apiClient.get(`/v1/core-pos/orders/batch`, {
        params: {
          ids: orderIds.join(','),
          include: ['items', 'details']
        }
      })
      logger.debug(`[BarService] Fetched batch order details:`, response.data)
      return response.data?.data || []
    } catch (error) {
      throw errorHandler.handleApi(error, '[BarService] fetchOrdersDetails')
    }
  }
}
