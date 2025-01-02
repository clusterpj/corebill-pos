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
      logger.info(`[KitchenService] Fetching all orders for section ${sectionId}`)
      
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
      console.error('❌ [KitchenService] Error in fetchOrders:', error)
      throw errorHandler.handleApi(error, '[KitchenService] fetchOrders')
    }
  }

  static async fetchOrdersByStatus(sectionId, status) {
    try {
      console.log(`🔍 [KitchenService] Fetching ${status} orders for section ${sectionId}`)
      
      const response = await apiClient.post('/v1/core-pos/listordersbysection', null, {
        params: {
          section_id: sectionId,
          status: status,
          type: 'BOTH'
        }
      })

      console.log(`📦 [KitchenService] Raw ${status} orders:`, response.data)

      const orders = response.data?.orders || []
      const processedOrders = orders.map(order => {
        console.log('Processing order:', order)
        return {
          ...order,
          status: status, // Explicitly set the status from the parameter
          type: order.type || 'holdInvoice',
          // Add sections array if not present to avoid undefined checks
          sections: []
        }
      })

      // Fetch details for each order - passing the status to fetchOrderItems
      const orderDetails = await Promise.all(
        processedOrders.map(order => {
          console.log(`📝 Fetching details for order ${order.id} of type ${order.type}`)
          return this.fetchOrderItems(order.id, order.type, status) // Pass status here
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
      console.error(`❌ [KitchenService] Error fetching ${status} orders:`, error)
      throw errorHandler.handleApi(error, '[KitchenService] fetchOrdersByStatus')
    }
  }

  static async fetchOrderItems(orderId, type = 'HOLD', status = 'P') {
    try {
      // Normalize the type for API call
      const orderType = type?.toUpperCase() === 'INVOICE' ? 'INVOICE' : 'HOLD'
      
      console.log(`🔍 [KitchenService] Fetching items for order ${orderId}:`, {
        type: orderType,
        status: status,
        orderId
      })
      
      const response = await apiClient.post('/v1/core-pos/getsectionanditem', null, {
        params: {
          id: orderId,
          type: orderType,
          pos_status: status // Add pos_status parameter here
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
    console.log(type)
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
      console.log (updatePromises)
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
