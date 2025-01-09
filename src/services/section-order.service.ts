// src/services/section-order.service.ts

import apiClient from './api/client'
import { logger } from '@/utils/logger'
import { Order, OrderStatus } from '@/types/order'

export interface SectionOrder {
  id: number
  description?: string | null
  invoice_date: string
  due_date: string
  user_id: number
  cash_register_id: number | null
  type: 'holdInvoice' | 'Invoice'
  invoice_number?: string
  status?: OrderStatus
  items?: OrderItem[]
}

export interface OrderItem {
  id: number
  name: string
  description: string | null
  price: number
  quantity: string
  unit_name: string
  discount: string
  tax: number
  total: number
  section_id: number
  section_type?: 'kitchen' | 'bar'
}

export interface Section {
  id: number
  name: string
  company_id: number
}

export interface SectionResponse {
  section: Section
  items: OrderItem[]
}

class SectionOrderService {
  private async getOrdersBySectionAndType(sectionId: number, type: 'HOLD' | 'INVOICE', status: 'P' | 'C' = 'P') {
    try {
      const response = await apiClient.post('/v1/core-pos/listordersbysection', null, {
        params: {
          section_id: sectionId,
          type,
          status
        }
      })

      if (!response.data?.orders) {
        throw new Error('Invalid response format')
      }

      return response.data.orders.map((order: any) => ({
        ...order,
        type: order.type === 'Invoice' ? 'Invoice' : 'holdInvoice',
        status: order.status || OrderStatus.PENDING
      })) as SectionOrder[]
    } catch (error) {
      logger.error('Failed to fetch orders by section', {
        sectionId,
        type,
        status,
        error
      })
      throw error
    }
  }

  private async getOrderDetails(orderId: number, type: 'HOLD' | 'INVOICE') {
    try {
      const response = await apiClient.post('/v1/core-pos/getsectionanditem', null, {
        params: {
          id: orderId,
          type
        }
      })

      if (!response.data?.data) {
        throw new Error('Invalid response format')
      }

      return response.data.data as SectionResponse[]
    } catch (error) {
      logger.error('Failed to fetch order details', {
        orderId,
        type,
        error
      })
      throw error
    }
  }

  /**
   * Gets all pending orders for a section
   * @param sectionId - The section ID to fetch orders for
   * @returns Promise<SectionOrder[]> Array of orders with status 'P' (pending)
   */
  async getAllOrdersForSection(sectionId: number): Promise<SectionOrder[]> {
    logger.debug('Fetching pending orders for section', { sectionId })
    
    try {
      // Fetch both HOLD and INVOICE orders
      const [holdOrders, invoiceOrders] = await Promise.all([
        this.getOrdersBySectionAndType(sectionId, 'HOLD'),
        this.getOrdersBySectionAndType(sectionId, 'INVOICE')
      ])

      // Fetch details for all orders
      const orderDetailsPromises = [
        ...holdOrders.map(order => this.getOrderDetails(order.id, 'HOLD')),
        ...invoiceOrders.map(order => this.getOrderDetails(order.id, 'INVOICE'))
      ]

      const orderDetailsResults = await Promise.all(orderDetailsPromises)

      // Combine orders with their details
      const allOrders = [...holdOrders, ...invoiceOrders]
      const enrichedOrders = allOrders.map((order, index) => {
        const details = orderDetailsResults[index]
        const items = details.flatMap(section => 
          section.items.map(item => ({
            ...item,
            section_type: section.section.name.toLowerCase()
          }))
        )

        return {
          ...order,
          items
        }
      })

      return enrichedOrders
    } catch (error) {
      logger.error('Failed to fetch all orders for section', {
        sectionId,
        error
      })
      throw error
    }
  }

  async updateOrderStatus(orderId: number, type: 'HOLD' | 'INVOICE', status: OrderStatus) {
    try {
      // Implementation depends on your API endpoint for status updates
      // This is a placeholder - you'll need to implement the actual API call
      const response = await apiClient.post(`/v1/core-pos/updateorderstatus`, {
        id: orderId,
        type,
        status
      })

      return response.data
    } catch (error) {
      logger.error('Failed to update order status', {
        orderId,
        type,
        status,
        error
      })
      throw error
    }
  }
}

export const sectionOrderService = new SectionOrderService()
export default sectionOrderService