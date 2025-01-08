import { defineStore } from 'pinia'
import { state, mutations } from './cart/state'
import { getters } from './cart/getters'
import { actions } from './cart/actions'
import { invoiceActions } from './cart/invoice'
import { cartSync } from '../services/cartSync'
import { logger } from '../utils/logger'

export const useCartStore = defineStore('cart', {
  state,
  getters,
  actions: {
    // Initialize store with saved state
    initializeFromStorage() {
      const savedState = cartSync.loadCartState()
      if (savedState) {
        this.$patch(savedState)
        logger.info('Cart initialized from storage:', savedState)
      }
    },

    // Original actions with sync added
    addItem(product, quantity = 1) {
      try {
        if (!product || !product.id) {
          logger.warn('Invalid product data:', product)
          return
        }
        
        // Check if we already have this product in the cart
        const existingItem = this.items.find(i => 
          i.id === product.id && 
          !i.modifications?.length && 
          !i.notes
        )
        
        if (existingItem) {
          // If we have an unmodified version, just increase quantity
          existingItem.quantity += quantity
        } else {
          // Add unique instance ID to each item
          const itemsToAdd = Array.from({ length: quantity }, (_, i) => ({
            ...product,
            instanceId: `${product.id}-${Date.now()}-${i}`,
            quantity: 1
          }))
          
          this.items.push(...itemsToAdd)
        }
        
        const stateToSync = {
          ...this.$state,
          items: this.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            instanceId: item.instanceId,
            modifications: item.modifications || [],
            notes: item.notes || ''
          }))
        }
        cartSync.saveCartState(stateToSync)
      } catch (error) {
        logger.error('Error in addItem:', {
          error,
          product,
          quantity,
          currentState: this.$state
        })
      }
    },

    updateItemQuantity(itemId, quantity, index = null) {
      actions.updateItemQuantity(this, { itemId, quantity, index })
      cartSync.saveCartState(this.$state)
    },

    removeItem(itemId, index = null) {
      actions.removeItem(this, { itemId, index })
      cartSync.saveCartState(this.$state)
    },

    splitItem(index, splitQuantity) {
      actions.splitItem(this, index, splitQuantity)
      cartSync.saveCartState(this.$state)
    },

    // State mutations
    setDiscount(type, value) {
      mutations.setDiscount(this, { type, value })
      cartSync.saveCartState(this.$state)
    },

    setNotes(notes) {
      mutations.setNotes(this, notes)
      cartSync.saveCartState(this.$state)
    },

    setType(type) {
      mutations.setType(this, type)
      cartSync.saveCartState(this.$state)
    },

    setSelectedTables(tables) {
      mutations.setSelectedTables(this, tables)
      cartSync.saveCartState(this.$state)
    },

    setHoldInvoiceId(id) {
      mutations.setHoldInvoiceId(this, id)
      cartSync.saveCartState(this.$state)
    },

    setHoldOrderDescription(description) {
      mutations.setHoldOrderDescription(this, description)
      cartSync.saveCartState(this.$state)
    },

    modifyItem({ instanceId, modifications, notes }) {
      try {
        const item = this.items.find(i => i.instanceId === instanceId)
        if (item) {
          // Update the item
          item.modifications = modifications
          item.notes = notes
          
          // Recalculate price
          const basePrice = item.basePrice || item.price
          const modificationTotal = modifications?.reduce((sum, mod) => {
            return sum + (mod.options.find(opt => opt.selected)?.priceAdjustment || 0)
          }, 0) || 0
          item.price = basePrice + modificationTotal
          item.basePrice = basePrice // Store original price
          
          // Save to localStorage
          cartSync.saveCartState(this.$state)
          
          logger.info('Item modified successfully:', {
            itemId,
            modifications,
            notes,
            newPrice: item.price
          })
        }
      } catch (error) {
        logger.error('Error in modifyItem:', {
          error,
          itemId,
          modifications,
          notes,
          currentState: this.$state
        })
        throw error
      }
    },

    clearCart() {
      try {
        mutations.clearCart(this)
        // Ensure we're passing a valid state object
        const stateToSync = {
          items: this.items || [],
          discountType: this.discountType,
          discountValue: this.discountValue || 0,
          taxRate: this.taxRate || 0,
          total: this.total || 0,
          subtotal: this.subtotal || 0
        }
        cartSync.saveCartState(stateToSync)
      } catch (error) {
        logger.error('Error in clearCart:', error)
      }
    },

    loadInvoice(invoice) {
      actions.loadInvoice(this, invoice)
      cartSync.saveCartState(this.$state)
    },

    async updateInvoice() {
      return actions.updateInvoice(this)
    },

    // Invoice preparation actions
    prepareInvoiceData(storeId, cashRegisterId, referenceNumber) {
      return invoiceActions.prepareInvoiceData(this, this, { 
        storeId, 
        cashRegisterId, 
        referenceNumber 
      })
    },

    prepareHoldInvoiceData(storeId, cashRegisterId, referenceNumber) {
      return invoiceActions.prepareHoldInvoiceData(this, this, {
        storeId,
        cashRegisterId,
        referenceNumber
      })
    }
  }
})
