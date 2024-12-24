import { logger } from '../utils/logger'

const CART_STORAGE_KEY = 'current-cart-state'
const CART_CHANNEL_NAME = 'pos-cart-sync'

interface CartState {
  items: any[]
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

      // Ensure items array exists
      const items = Array.isArray(cartState.items) ? cartState.items : []
      
      const stateToSave = {
        items,
        discountType: cartState.discountType || null,
        discountValue: cartState.discountValue || 0,
        taxRate: cartState.taxRate || 0,
        total: cartState.total || 0,
        subtotal: cartState.subtotal || 0,
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
      logger.error('Error saving cart state:', error)
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
