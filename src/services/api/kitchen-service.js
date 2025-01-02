import { apiClient } from './client'
import { errorHandler } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'

class KitchenApiError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'KitchenApiError'
    this.code = code
  }
}

class NetworkError extends Error {
  constructor(message, originalError) {
    super(message)
    this.name = 'NetworkError'
    this.code = 'NETWORK_ERROR'
    this.originalError = originalError
  }
}

export class KitchenService {
  static async retryWithBackoff(operation, context, maxRetries = 3) {
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        const delay = Math.pow(2, attempt - 1) * 1000 // Exponential backoff: 1s, 2s, 4s
        
        logger.warn(`Retrying operation in ${delay}ms (attempt ${attempt}/${maxRetries}):`, {
          context,
          error: error.message || 'Unknown error'
        })
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new NetworkError('Network connection failed', lastError)
  }
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
    const context = { 
      operation: 'updateOrderStatus', 
      orderIds: Array.isArray(orderIds) ? orderIds : [orderIds]
    }

    return await this.retryWithBackoff(async () => {
      const apiStatus = status === 'completed' ? 'C' : 'P'
      
      const updatePromises = context.orderIds.map(id => 
        apiClient.post('/v1/core-pos/changeordestatus', null, {
          params: {
            id,
            status: apiStatus,
            type: type?.toUpperCase() || 'HOLD'
          }
        })
      )

      const results = await Promise.all(updatePromises)
      
      const failedUpdates = results.filter(r => !r.data?.success)
      if (failedUpdates.length > 0) {
        throw new KitchenApiError(
          'Failed to update order status',
          'STATUS_UPDATE_FAILED'
        )
      }

      return { success: true }
    }, context)
  }
}
