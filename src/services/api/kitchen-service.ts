import { apiClient } from './client'
import { errorHandler } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'
import { 
  Order, 
  OrderItem, 
  Section,
  PosStatus,
  OrderStatus,
  OrderType,
  OrderStatusChangeRequest,
  OrderItemStatusChangeRequest
} from '@/types/order'

class KitchenApiError extends Error {
  constructor(message: string, code: string) {
    super(message)
    this.name = 'KitchenApiError'
    this.code = code
  }

  code: string
}

class NetworkError extends Error {
  constructor(message: string, originalError: Error) {
    super(message)
    this.name = 'NetworkError'
    this.code = 'NETWORK_ERROR'
    this.originalError = originalError
  }

  code: string
  originalError: Error
}

interface ApiResponse<T> {
  data: T
  success?: boolean
  message?: string
}

interface SectionOrdersResponse {
  section_id: string
  type: string
  status: string
  orders: Order[]
}

const DEFAULT_ORDER_STATUS = 'pending' as OrderStatus
const DEFAULT_ORDER_TYPE = 'DINE IN' as OrderType

export class KitchenService {
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: Record<string, unknown>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'))
        const delay = Math.pow(2, attempt - 1) * 1000 // Exponential backoff: 1s, 2s, 4s
        
        logger.warn(`Retrying operation in ${delay}ms (attempt ${attempt}/${maxRetries}):`, {
          context,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new NetworkError('Network connection failed', lastError ?? new Error('Unknown error'))
  }

  static async fetchOrders(sectionId: number): Promise<Order[]> {
    try {
      // Core data fetching with dual status query
      logger.info(`[KitchenService] Fetching all orders for section ${sectionId}`);
      const [activeOrders, completedOrders] = await Promise.all([
        this.fetchOrdersByStatus(sectionId, PosStatus.PENDING),
        this.fetchOrdersByStatus(sectionId, PosStatus.COMPLETED)
      ]);

      const allOrders = [...activeOrders, ...completedOrders]
      logger.debug('Combined orders:', { count: allOrders.length })

      return allOrders
    } catch (error) {
      console.error('❌ [KitchenService] Error in fetchOrders:', error)
      throw errorHandler.handleApi(error, '[KitchenService] fetchOrders')
    }
  }

  static async fetchOrdersByStatus(sectionId: number, status: PosStatus): Promise<Order[]> {
    try {
      logger.info(`[KitchenService] Fetching ${status} orders for section ${sectionId}`)
      
      const response = await apiClient.post('/v1/core-pos/listordersbysection', null, {
        params: {
          section_id: sectionId,
          status: status,
          type: 'BOTH'
        }
      })

      logger.debug(`Raw API response:`, { data: response.data })

      // Get orders from the response
      const orders = response.data.orders || []
      logger.debug(`Processing ${orders.length} orders`)

      // Process each order
      const processedOrders = await Promise.all(orders.map(async (order: any) => {
        try {
          logger.debug(`Processing order ${order.id}`, { 
            type: order.type,
            status: order.status,
            invoice_number: order.invoice_number
          })

          // Skip orders without IDs
          if (!order.id) {
            logger.warn(`Skipping order without ID`, { order })
            return null
          }

          // Normalize order type
          const orderType = order.type?.toLowerCase() === 'invoice' ? 'INVOICE' : 'HOLD'
          const displayType = order.type?.toLowerCase() === 'invoice' ? 'Invoice' : 'Hold Order'
          const reference = orderType === 'INVOICE' ? order.invoice_number : `Hold #${order.id}`

          // Fetch items for this order
          const items = await this.fetchOrderItems(order.id, orderType, status)
          logger.debug(`Fetched ${items.length} items for order ${order.id}`)

          // Convert item IDs to numbers
          const numericItems = items.map(item => ({
            ...item,
            id: Number(item.id)
          }))

          // Skip orders without kitchen items
          if (!numericItems.some(item => item.section_type === 'kitchen')) {
            logger.debug(`Skipping order ${order.id} - no kitchen items`)
            return null
          }

          const processedOrder = {
            ...order,
            id: Number(order.id), // Ensure ID is a number
            items: numericItems,
            pos_status: status,
            // Ensure required fields have defaults
            status: DEFAULT_ORDER_STATUS,
            type: orderType,
            total: order.total || 0,
            subtotal: order.subtotal || 0,
            tax: order.tax || 0,
            // Add formatted reference for easy display
            reference,
            // Add display type for UI
            displayType
          }

          logger.debug(`Successfully processed order ${order.id}`)
          return processedOrder
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          logger.error(`Failed to process order ${order.id}:`, {
            error: errorMessage,
            order: {
              id: order.id,
              type: order.type,
              status: order.status
            }
          })
          return null
        }
      }))

      // Filter out any failed orders
      const validOrders = processedOrders.filter((order): order is Order => order !== null)

      logger.info(`Successfully processed ${validOrders.length} out of ${orders.length} orders with status ${status}`)
      return validOrders
    } catch (error) {
      console.error(`❌ [KitchenService] Error fetching ${status} orders:`, error)
      throw errorHandler.handleApi(error, '[KitchenService] fetchOrdersByStatus')
    }
  }

  static async fetchOrderItems(orderId: number, type: 'HOLD' | 'INVOICE' = 'HOLD', status: PosStatus = PosStatus.PENDING): Promise<OrderItem[]> {
    try {
      logger.debug(`[KitchenService] Fetching items for order ${orderId}`, {
        type,
        status,
        orderId
      })

      const response = await apiClient.post('/v1/core-pos/getsectionanditem', null, {
        params: {
          id: orderId,  // This is just the order ID, regardless of type
          type: type,
          pos_status: status
        }
      })

      if (!response.data?.data) {
        logger.warn(`No items data returned for order ${orderId}`)
        return []
      }

      // Keep the raw item ID from the response
      const items = (response.data as ApiResponse<OrderItem[]>).data.flatMap((section: any) => {
        if (!section.items) return []
        
        return section.items.map((item: any) => ({
          ...item,  // This preserves the raw id from the response
          id: Number(item.id), // Ensure item ID is a number
          section_type: section.section_type || 'kitchen',
          pos_status: item.pos_status || section.pos_status || status,
          section: section.section
        }))
      })

      logger.debug(`Processed ${items.length} items for order ${orderId}`, {
        items: items.map((i: OrderItem) => ({ id: i.id, name: i.name }))
      })
      return items
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Failed to fetch items for order ${orderId}:`, {
        error: errorMessage,
        params: { orderId, type, status }
      })
      return []
    }
  }

  static async changeOrderStatus(request: OrderStatusChangeRequest): Promise<Order> {
    try {
      logger.info(`[KitchenService] Changing order status for order ${request.orderId} to ${request.pos_status}`)
      
      const response = await apiClient.post('/v1/core-pos/changeordestatus', {
         idorder: request.orderId,
         type: request.type,
         pos_status: request.pos_status
      })

      return (response.data as ApiResponse<Order>).data
    } catch (error) {
      console.error('❌ [KitchenService] Error in changeOrderStatus:', error)
      throw errorHandler.handleApi(error, '[KitchenService] changeOrderStatus')
    }
  }

  static async changeOrderItemStatus(request: OrderItemStatusChangeRequest): Promise<OrderItem> {
    try {
      const payload = {
        idorder: Number(request.orderId),
        iditem: Number(request.itemId),
        type: (request.type ?? 'HOLD').toUpperCase(),
        pos_status: request.pos_status
      }

      logger.debug('Sending item status update with payload:', payload)

      const response = await apiClient.post('/v1/core-pos/changeOrderStatusItem', null, {
        params: payload
      })

      if (!response.data?.data) {
        throw new KitchenApiError('No data returned from API', 'NO_DATA')
      }

      return response.data.data
    } catch (error) {
      logger.error('Failed to change item status:', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  static async updateOrderStatus(orderIds: number | number[], status: 'completed' | 'pending', type: 'HOLD' | 'INVOICE'): Promise<{ success: boolean }> {
    const context = { 
      operation: 'updateOrderStatus', 
      orderIds: Array.isArray(orderIds) ? orderIds : [orderIds]
    }
    return await this.retryWithBackoff(async () => {
      const apiStatus = status === 'completed' ? PosStatus.COMPLETED : PosStatus.PENDING
      
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
