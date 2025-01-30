import { ref } from 'vue'
import { useCartStore } from '../../../../../stores/cart-store'
import { usePosStore } from '../../../../../stores/pos-store'
import { useTaxTypesStore } from '../../../../../stores/tax-types'
import { logger } from '../../../../../utils/logger'

export function useCart() {
  const cartStore = useCartStore()
  const posStore = usePosStore()
  const taxTypesStore = useTaxTypesStore()
  const updating = ref(false)

  const clearOrder = () => {
    try {
      logger.debug('Clearing order, current state:', {
        items: cartStore.items?.length,
        total: cartStore.total
      })
      cartStore.clearCart()
    } catch (error) {
      logger.error('Error clearing order:', error)
      window.toastr?.['error']('Failed to clear order')
    }
  }

  const updateQuantity = (itemId, quantity, index) => {
    cartStore.updateItemQuantity(itemId, quantity, index)
  }

  const removeItem = (itemId, index) => {
    cartStore.removeItem(itemId, index)
  }

  // Preserve the exact update functionality as specified
  const updateOrder = async () => {                                                         
    try {                                                                                   
      const description = cartStore.holdOrderDescription                                    
                                                                                            
      if (!description) {                                                                   
        throw new Error('No order description found')                                       
      }                                                                                     
                                                                                            
      updating.value = true                                                                 
                                                                                            
      // Ensure tax types are loaded                                                        
      if (!taxTypesStore.taxTypes.length) {                                                 
        await taxTypesStore.fetchTaxTypes()                                                 
      }                                                                                     
                                                                                            
      // Calculate base amount for taxes                                                    
      const baseAmount = cartStore.subtotal - cartStore.discountAmount                      
                                                                                            
      // Format tax data correctly before sending                                           
      const taxes = taxTypesStore.availableTaxTypes.map(tax => ({                           
        tax_type_id: Number(tax.id),                                                        
        company_id: Number(tax.company_id),                                                 
        name: tax.name,                                                                     
        amount: Math.round(baseAmount * (tax.percent / 100)),                               
        percent: Number(tax.percent),                                                       
        compound_tax: Number(tax.compound_tax),                                             
        estimate_id: null,                                                                  
        invoice_item_id: null,                                                              
        estimate_item_id: null,                                                             
        item_id: null                                                                       
      }))                                                                                   
                                                                                            
      // Prepare the order data with formatted taxes                                        
      const orderData = {                                                                   
        ...cartStore.prepareHoldInvoiceData(                                                
          posStore.selectedStore,                                                           
          posStore.selectedCashier,                                                         
          description                                                                       
        ),                                                                                  
        taxes // Override with correctly formatted taxes                                    
      }                                                                                     
                                                                                            
      // Calculate total tax amount                                                         
      orderData.tax = taxes.reduce((sum, tax) => sum + tax.amount, 0)                       
                                                                                            
      logger.debug('Updating order with formatted taxes:', {                                
        taxes,                                                                              
        totalTax: orderData.tax,                                                            
        baseAmount                                                                          
      })                                                                                    
                                                                                            
      // Update the hold invoice using description as identifier                            
      const response = await posStore.updateHoldInvoice(description, orderData)             
                                                                                            
      if (response.success) {                                                               
        window.toastr?.['success']('Order updated successfully')                            
        // Clear the hold invoice ID after successful update                                
        cartStore.setHoldInvoiceId(null)                                                    
        // Clear the cart after successful update                                           
        cartStore.clearCart()                                                               
      } else {                                                                              
        throw new Error(response.message || 'Failed to update order')                       
      }                                                                                     
    } catch (error) {                                                                       
      logger.error('Failed to update order:', error)                                        
      window.toastr?.['error'](error.message || 'Failed to update order')                   
    } finally {                                                                             
      updating.value = false                                                                
    }                                                                                       
  }                                  

  return {
    cartStore,
    updating,
    clearOrder,
    updateQuantity,
    removeItem,
    updateOrder
  }
}
