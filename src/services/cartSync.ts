import { logger } from '../utils/logger'

const CART_STORAGE_KEY = 'current-cart-state'
const CART_CHANNEL_NAME = 'pos-cart-sync'

interface CartState {
  items: Array<{
    id: number
    name: string
    price: number
    quantity: number
    modifications?: Array<{
      id: number
      name: string
      options: Array<{
        id: number
        name: string
        priceAdjustment: number
        selected: boolean
      }>
    }>
    notes?: string
  }>
  discountType?: string
  discountValue?: number
  taxRate?: number
  total?: number
  subtotal?: number
  timestamp?: number
}

class CartSyncService {
  private channel: BroadcastChannel

  constructor() {
    this.channel = new BroadcastChannel(CART_CHANNEL_NAME)
    logger.info('Cart sync service initialized')
  }

  // Save cart state and broadcast to other windows
  saveCartState(cartState: CartState) {
    try {
      // Validate cart state
      if (!cartState) {
        logger.warn('Attempted to save null cart state')
        return
      }

      // Deep clone the cart state to avoid reference issues
      const stateToProcess = JSON.parse(JSON.stringify(cartState))

      // Ensure items array exists and is properly formatted
      const items = Array.isArray(stateToProcess.items) 
        ? stateToProcess.items.map(item => ({
            id: item.id || 0,
            name: item.name || '',
            price: item.price || 0,
            quantity: item.quantity || 1,
            modifications: Array.isArray(item.modifications)
              ? item.modifications.map(mod => ({
                  id: mod.id || 0,
                  name: mod.name || '',
                  options: mod.options.map(opt => ({
                    id: opt.id || 0,
                    name: opt.name || '',
                    priceAdjustment: Number(opt.priceAdjustment) || 0,
                    selected: Boolean(opt.selected)
                  }))
                }))
              : [],
            notes: item.notes || ''
          }))
        : []
      
      const stateToSave = {
        items,
        discountType: stateToProcess.discountType || 'fixed',
        discountValue: Number(stateToProcess.discountValue) || 0,
        taxRate: Number(stateToProcess.taxRate) || 0,
        total: Number(stateToProcess.total) || 0,
        subtotal: Number(stateToProcess.subtotal) || 0,
        notes: stateToProcess.notes || '',
        type: stateToProcess.type || null,
        holdInvoiceId: stateToProcess.holdInvoiceId || null,
        holdOrderDescription: stateToProcess.holdOrderDescription || null,
        selectedTables: Array.isArray(stateToProcess.selectedTables) ? stateToProcess.selectedTables : [],
        timestamp: Date.now()
      }
      
      // Save to localStorage
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stateToSave))
      
      // Broadcast to other windows
      this.channel.postMessage({
        type: 'CART_UPDATED',
        payload: stateToSave
      })
      
      logger.debug('Cart state saved and broadcasted:', stateToSave)
    } catch (error) {
      // Enhanced error logging
      logger.error('Error saving cart state:', {
        error: error instanceof Error ? error.message : error,
        cartState: JSON.stringify(cartState, null, 2),
        stack: error instanceof Error ? error.stack : undefined
      })
      // Don't throw the error, just log it to prevent UI disruption
    }
  }

  // Load cart state from localStorage
  loadCartState(): CartState | null {
    try {
      const savedState = localStorage.getItem(CART_STORAGE_KEY)
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        // Ensure items is always an array
        parsedState.items = Array.isArray(parsedState.items) ? parsedState.items : []
        logger.debug('Loaded cart state:', parsedState)
        return parsedState
      }
    } catch (error) {
      logger.error('Error loading cart state:', error)
    }
    // Return empty cart state if nothing is saved
    return {
      items: [],
      discountType: null,
      discountValue: 0,
      taxRate: 0,
      total: 0,
      subtotal: 0
    }
  }

  // Subscribe to cart updates
  subscribeToUpdates(callback: (state: CartState) => void) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CART_UPDATED') {
        logger.debug('Received cart update:', event.data.payload)
        callback(event.data.payload)
      }
    }

    this.channel.addEventListener('message', handleMessage)
    
    // Return cleanup function
    return () => {
      this.channel.removeEventListener('message', handleMessage)
      this.channel.close()
    }
  }
}

// Export singleton instance
export const cartSync = new CartSyncService()
