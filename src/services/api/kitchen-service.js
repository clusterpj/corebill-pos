import { apiClient } from './client'
import { errorHandler } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'

export class KitchenService {
  static async fetchOrders(sectionId) {
    try {
      logger.info(`[KitchenService] Fetching orders for section ${sectionId}`)
      console.log(`🚀 [KitchenService] Starting fetch for section ${sectionId}`)

      // Fetch both HOLD and INVOICE orders that are processing
      console.log('🔍 Fetching orders with section:', sectionId)
      const [holdOrders, invoiceOrders] = await Promise.all([
        apiClient.post('/v1/core-pos/listordersbysection', null, {
          params: {
            section_id: sectionId,
            status: 'P',
            type: 'HOLD'
          }
        }),
        apiClient.post('/v1/core-pos/listordersbysection', null, {
          params: {
            section_id: sectionId,
            status: 'P',
            type: 'INVOICE'
          }
        })
      ])

      console.log('📦 [KitchenService] Raw HOLD orders:', holdOrders.data)
      console.log('📦 [KitchenService] Raw INVOICE orders:', invoiceOrders.data)

      const orders = [
        ...(holdOrders.data?.orders || []).map(order => ({
          ...order,
          type: 'HOLD',
          status: holdOrders.data.status
        })),
        ...(invoiceOrders.data?.orders || []).map(order => ({
          ...order,
          type: 'INVOICE',
          status: invoiceOrders.data.status
        }))
      ]

      console.log(`✅ [KitchenService] Combined ${orders.length} orders:`, orders)

      // Fetch items and details for each order
      console.log('🔄 [KitchenService] Starting to fetch details for orders')
      const orderDetails = await Promise.all(
        orders.map(order => {
          console.log(`📝 Fetching details for order ${order.id} of type ${order.type}`)
          return this.fetchOrderItems(order.id, order.type)
        })
      )

      console.log('📋 [KitchenService] All order details:', orderDetails)

      // Merge order details with orders
      const ordersWithDetails = orders.map((order, index) => {
        const details = orderDetails[index]
        console.log(`🔗 Merging details for order ${order.id}:`, details)
        return {
          ...order,
          sections: details
        }
      })

      logger.debug('[KitchenService] Fetched orders with details:', ordersWithDetails)
      console.log('🏁 [KitchenService] Final processed orders:', ordersWithDetails)
      return ordersWithDetails
    } catch (error) {
      console.error('❌ [KitchenService] Error in fetchOrders:', error)
      throw errorHandler.handleApi(error, '[KitchenService] fetchOrders')
    }
  }

  static async fetchOrderItems(orderId, type = 'HOLD') {
    try {
      const orderType = type?.toUpperCase() === 'INVOICE' ? 'INVOICE' : 'HOLD'
      console.log(`🔍 [KitchenService] Fetching items for order ${orderId} of type ${orderType}`)
      const response = await apiClient.post('/v1/core-pos/getsectionanditem', null, {
        params: {
          id: orderId,
          type: orderType
        }
      })
      console.log(`✅ [KitchenService] Items fetched for order ${orderId}:`, response.data)
      return response.data?.data || []
    } catch (error) {
      console.error(`❌ [KitchenService] Error fetching items for order ${orderId}:`, error)
      throw errorHandler.handleApi(error, '[KitchenService] fetchOrderItems')
    }
  }

  static async updateOrderStatus(orderIds, status, type) {
    try {
      const apiStatus = status === 'completed' ? 'C' : 'P'
      console.log(`🔄 [KitchenService] Updating status for orders:`, {
        orderIds,
        newStatus: apiStatus,
        type
      })
      
      const response = await apiClient.put(`/v1/core-pos/orders/batch/status`, {
        order_ids: Array.isArray(orderIds) ? orderIds : [orderIds],
        status: apiStatus,
        type
      })
      
      console.log(`✅ [KitchenService] Status update response:`, response.data)
      return response.data
    } catch (error) {
      console.error('❌ [KitchenService] Error updating order status:', error)
      throw errorHandler.handleApi(error, '[KitchenService] updateOrderStatus')
    }
  }
}