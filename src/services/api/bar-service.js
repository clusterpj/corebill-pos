import { apiClient } from './client'
import { errorHandler } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'

export class BarService {
  static async fetchOrders(sectionId) {
    try {
      logger.info(`[BarService] Fetching all orders for section ${sectionId}`)
      
      // Fetch both active and completed orders
      const [activeOrders, completedOrders] = await Promise.all([
        this.fetchOrdersByStatus(sectionId, 'P'),
        this.fetchOrdersByStatus(sectionId, 'C')
      ])

      console.log('Active orders:', activeOrders)
      console.log('Completed orders:', completedOrders)

      const allOrders = [...activeOrders, ...completedOrders]
      console.log('Combined orders:', allOrders)

      return allOrders
    } catch (error) {
      console.error('❌ [BarService] Error in fetchOrders:', error)
      throw errorHandler.handleApi(error, '[BarService] fetchOrders')
    }
  }

  static async fetchOrdersByStatus(sectionId, status) {
    try {
      console.log(`🔍 [BarService] Fetching ${status} orders for section ${sectionId}`)
      
      const response = await apiClient.post('/v1/core-pos/listordersbysection', null, {
        params: {
          section_id: sectionId,
          status: status,
          type: 'BOTH'
        }
      })

      console.log(`📦 [BarService] Raw ${status} orders:`, response.data)

      const orders = response.data?.orders || []
      const processedOrders = orders.map(order => {
        console.log('Processing order:', order)
        return {
          ...order,
          status: status,
          type: order.type || 'holdInvoice',
          // Add sections array if not present to avoid undefined checks
          sections: []
        }
      })

      // Fetch details for each order
      const orderDetails = await Promise.all(
        processedOrders.map(order => {
          console.log(`📝 Fetching details for order ${order.id} of type ${order.type}`)
          return this.fetchOrderItems(order.id, order.type, status)
        })
      )

      // Merge order details with orders
      return processedOrders.map((order, index) => {
        const details = orderDetails[index]
        console.log(`Processing order ${order.id} details:`, details)
        return {
          ...order,
          sections: details,
          // Add formatted reference for easy display
          reference: order.type === 'Invoice' ? order.invoice_number : `Hold #${order.id}`,
          // Add display type for UI
          displayType: order.type === 'Invoice' ? 'Invoice' : 'Hold Order'
        }
      })
    } catch (error) {
      console.error(`❌ [BarService] Error fetching ${status} orders:`, error)
      throw errorHandler.handleApi(error, '[BarService] fetchOrdersByStatus')
    }
  }

  static async fetchOrderItems(orderId, type = 'HOLD', status = 'P') {
    try {
      const orderType = type?.toUpperCase() === 'INVOICE' ? 'INVOICE' : 'HOLD'
      
      console.log(`🔍 [BarService] Fetching items for order ${orderId}:`, {
        type: orderType,
        status: status,
        orderId
      })
      
      const response = await apiClient.post('/v1/core-pos/getsectionanditem', null, {
        params: {
          id: orderId,
          type: orderType,
          pos_status: status
        }
      })
      
      console.log(`✅ [BarService] Items fetched for order ${orderId}:`, response.data)
      return response.data?.data || []
    } catch (error) {
      console.error(`❌ [BarService] Error fetching items for order ${orderId}:`, error)
      throw errorHandler.handleApi(error, '[BarService] fetchOrderItems')
    }
  }

  static async updateOrderStatus(orderIds, status, type) {
    try {
      const apiStatus = status === 'completed' ? 'C' : 'P'
      
      // Normalize the type parameter
      const getApiType = (orderType) => {
        const upperType = orderType?.toUpperCase() || ''
        if (upperType === 'INVOICE') return 'INVOICE'
        if (upperType === 'HOLDINVOICE' || upperType === 'HOLD ORDER' || upperType === 'HOLD') return 'HOLD'
        return 'HOLD'
      }
      
      console.log(`🔄 [BarService] Updating order status:`, {
        orderIds: Array.isArray(orderIds) ? orderIds : [orderIds],
        status: apiStatus,
        originalType: type,
        normalizedType: getApiType(type)
      })
      
      const response = await apiClient.post('/v1/core-pos/changeordestatus', null, {
        params: {
          id: Array.isArray(orderIds) ? orderIds[0] : orderIds,
          status: apiStatus,
          type: getApiType(type)
        }
      })
      
      console.log(`✅ [BarService] Status update response:`, response.data)
      return response.data
    } catch (error) {
      console.error('❌ [BarService] Error updating order status:', error)
      throw errorHandler.handleApi(error, '[BarService] updateOrderStatus')
    }
  }
}