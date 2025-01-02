import { apiClient } from './client'
import { errorHandler } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'

export class BarService {
  static async fetchOrders(sectionId) {
    try {
      console.log('🔍 [BarService] Fetching orders with section:', sectionId)
      
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

      console.log('📦 [BarService] Raw HOLD orders:', holdOrders.data)
      console.log('📦 [BarService] Raw INVOICE orders:', invoiceOrders.data)

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

      console.log('✅ [BarService] Combined orders:', orders)

      const orderDetails = await Promise.all(
        orders.map(order => {
          console.log(`📝 Fetching details for order ${order.id} of type ${order.type}`)
          return this.fetchOrderItems(order.id, order.type)
        })
      )

      console.log('📋 [BarService] All order details:', orderDetails)

      const ordersWithDetails = orders.map((order, index) => {
        const details = orderDetails[index]
        console.log(`🔗 Merging details for order ${order.id}:`, details)
        return {
          ...order,
          sections: details
        }
      })

      console.log('🏁 [BarService] Final processed orders:', ordersWithDetails)
      return ordersWithDetails
    } catch (error) {
      console.error('❌ [BarService] Error in fetchOrders:', error)
      throw errorHandler.handleApi(error, '[BarService] fetchOrders')
    }
  }

  static async fetchOrderItems(orderId, type = 'HOLD') {
    try {
      const orderType = type?.toUpperCase() === 'INVOICE' ? 'INVOICE' : 'HOLD'
      console.log(`🔍 [BarService] Fetching items for order ${orderId} of type ${orderType}`)
      
      const response = await apiClient.post('/v1/core-pos/getsectionanditem', null, {
        params: {
          id: orderId,
          type: orderType
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
      console.log(`🔄 [BarService] Updating status:`, { orderIds, apiStatus, type })
      
      const response = await apiClient.put(`/v1/core-pos/orders/batch/status`, {
        order_ids: Array.isArray(orderIds) ? orderIds : [orderIds],
        status: apiStatus,
        type
      })
      
      console.log(`✅ [BarService] Status update response:`, response.data)
      return response.data
    } catch (error) {
      console.error('❌ [BarService] Error updating order status:', error)
      throw errorHandler.handleApi(error, '[BarService] updateOrderStatus')
    }
  }
}