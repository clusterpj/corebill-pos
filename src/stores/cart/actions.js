import { logger } from '../../utils/logger'
import { PriceUtils } from '../../utils/price'
import { posApi } from '../../services/api/pos-api'
import { useCompanyStore } from '../company'

export const actions = {
  addItem(state, product, quantity = 1) {
    logger.startGroup('Cart Store: Adding Item')
    try {
      logger.info('Adding item to cart:', { 
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          fromHeldOrder: product.fromHeldOrder,
          formatted_price: PriceUtils.format(product.price),
          section_id: product.section_id,
          section_type: product.section_type,
          section_name: product.section_name
        }, 
        quantity 
      })
      
      // Price from held order is already in cents, otherwise normalize it
      const price = product.fromHeldOrder ? product.price : PriceUtils.ensureCents(product.price)
      logger.info('Price validation:', { 
        originalPrice: product.price,
        fromHeldOrder: product.fromHeldOrder,
        isInDollars: PriceUtils.isInDollars(product.price),
        normalizedPrice: price,
        formatted: PriceUtils.format(price)
      })
      
      const existingItem = state.items.find(item => item.id === product.id)
      
      if (existingItem) {
        const oldQuantity = existingItem.quantity
        existingItem.quantity += quantity
        existingItem.total = existingItem.price * existingItem.quantity
        existingItem.sub_total = existingItem.total
        logger.info('Updated existing item:', {
          id: existingItem.id,
          name: existingItem.name,
          oldQuantity,
          newQuantity: existingItem.quantity,
          price: existingItem.price,
          total: existingItem.total,
          formatted_total: PriceUtils.format(existingItem.total)
        })
      } else {
        const newItem = {
          ...product,
          price,
          quantity,
          total: price * quantity,
          sub_total: price * quantity,
          discount_type: 'fixed',
          discount: 0,
          discount_val: 0,
          item_id: product.id,
          section_id: product.section_id,
          section_type: product.section_type,
          section_name: product.section_name
        }
        state.items.push(newItem)
        logger.info('Added new item:', {
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          formatted_price: PriceUtils.format(newItem.price),
          quantity: newItem.quantity,
          total: newItem.total,
          formatted_total: PriceUtils.format(newItem.total),
          section_id: newItem.section_id,
          section_type: newItem.section_type,
          section_name: newItem.section_name
        })
      }
    } catch (error) {
      logger.error('Failed to add item to cart:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  updateItemQuantity(state, { itemId, quantity, index = null }) {
    logger.startGroup('Cart Store: Updating Item Quantity')
    try {
      logger.info('Updating item quantity:', { itemId, quantity, index })
      
      let item
      if (index !== null) {
        item = state.items[index]
      } else {
        item = state.items.find(item => item.id === itemId)
      }

      if (item) {
        const oldQuantity = item.quantity
        const oldTotal = item.total
        
        if (quantity > 0) {
          item.quantity = quantity
          item.total = item.price * quantity
          item.sub_total = item.total
          
          logger.info('Item quantity updated:', {
            id: item.id,
            name: item.name,
            oldQuantity,
            newQuantity: quantity,
            oldTotal,
            newTotal: item.total,
            formatted_total: PriceUtils.format(item.total)
          })
        } else {
          logger.info('Removing item due to zero quantity:', {
            id: item.id,
            name: item.name
          })
          this.removeItem(state, { itemId, index })
        }
      } else {
        logger.warn('Item not found for quantity update:', { itemId, index })
      }
    } catch (error) {
      logger.error('Failed to update item quantity:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  splitItem(state, index, splitQuantity) {
    logger.startGroup('Cart Store: Splitting Item')
    try {
      logger.info('Splitting item:', { index, splitQuantity })
      
      const originalItem = state.items[index]
      if (!originalItem || splitQuantity >= originalItem.quantity) {
        logger.error('Invalid split operation:', { 
          originalItem: originalItem ? {
            id: originalItem.id,
            name: originalItem.name,
            quantity: originalItem.quantity
          } : null, 
          splitQuantity 
        })
        return
      }

      const originalQuantity = originalItem.quantity
      const remainingQuantity = originalQuantity - splitQuantity

      // Update original item quantity
      originalItem.quantity = remainingQuantity
      originalItem.total = originalItem.price * remainingQuantity
      originalItem.sub_total = originalItem.total

      // Create new item with split quantity
      const newItem = {
        ...originalItem,
        quantity: splitQuantity,
        total: originalItem.price * splitQuantity,
        sub_total: originalItem.price * splitQuantity
      }

      // Insert new item after the original item
      state.items.splice(index + 1, 0, newItem)
      
      logger.info('Split completed:', { 
        originalItem: {
          id: originalItem.id,
          name: originalItem.name,
          originalQuantity,
          remainingQuantity: originalItem.quantity,
          total: originalItem.total,
          formatted_total: PriceUtils.format(originalItem.total)
        },
        newItem: {
          id: newItem.id,
          name: newItem.name,
          quantity: newItem.quantity,
          total: newItem.total,
          formatted_total: PriceUtils.format(newItem.total)
        }
      })
    } catch (error) {
      logger.error('Failed to split item:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  removeItem(state, { itemId, index = null }) {
    logger.startGroup('Cart Store: Removing Item')
    try {
      logger.info('Removing item from cart:', { itemId, index })
      
      if (index !== null) {
        const removedItem = state.items[index]
        logger.info('Removing item by index:', {
          index,
          item: removedItem ? {
            id: removedItem.id,
            name: removedItem.name,
            quantity: removedItem.quantity,
            total: removedItem.total
          } : null
        })
        state.items.splice(index, 1)
      } else {
        const itemToRemove = state.items.find(item => item.id === itemId)
        logger.info('Removing item by ID:', {
          itemId,
          item: itemToRemove ? {
            id: itemToRemove.id,
            name: itemToRemove.name,
            quantity: itemToRemove.quantity,
            total: itemToRemove.total
          } : null
        })
        state.items = state.items.filter(item => item.id !== itemId)
      }
    } catch (error) {
      logger.error('Failed to remove item:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  setDiscount(state, { type, value }) {
    logger.startGroup('Cart Store: Setting Discount')
    try {
      logger.info('Setting discount:', { type, value })
      state.discountType = type
      state.discountValue = value
      
      // Calculate and log the effective discount
      const subtotal = state.items.reduce((sum, item) => sum + item.total, 0)
      const discountAmount = type === '%' ? 
        Math.round(subtotal * (value / 100)) : 
        PriceUtils.normalizePrice(value)
      
      logger.info('Discount applied:', {
        type,
        value,
        subtotal,
        formatted_subtotal: PriceUtils.format(subtotal),
        discountAmount,
        formatted_discount: PriceUtils.format(discountAmount),
        finalTotal: subtotal - discountAmount,
        formatted_final: PriceUtils.format(subtotal - discountAmount)
      })
    } catch (error) {
      logger.error('Failed to set discount:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  setNotes(state, notes) {
    logger.startGroup('Cart Store: Setting Notes')
    try {
      logger.info('Setting notes:', { notes })
      state.notes = notes
    } catch (error) {
      logger.error('Failed to set notes:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  setType(state, type) {
    logger.startGroup('Cart Store: Setting Type')
    try {
      logger.info('Setting order type:', type)
      state.type = type
    } catch (error) {
      logger.error('Failed to set order type:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  setSelectedTables(state, tables) {
    logger.startGroup('Cart Store: Setting Selected Tables')
    try {
      logger.info('Setting selected tables:', { tables })
      state.selectedTables = tables
    } catch (error) {
      logger.error('Failed to set selected tables:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  setHoldInvoiceId(state, id) {
    logger.startGroup('Cart Store: Setting Hold Invoice ID')
    try {
      logger.info('Setting hold invoice ID:', id)
      state.holdInvoiceId = id
      if (!id) {
        state.holdOrderDescription = null
      }
    } catch (error) {
      logger.error('Failed to set hold invoice ID:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  setHoldOrderDescription(state, description) {
    logger.startGroup('Cart Store: Setting Hold Order Description')
    try {
      logger.info('Setting hold order description:', description)
      state.holdOrderDescription = description
    } catch (error) {
      logger.error('Failed to set hold order description:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  clearCart(state) {
    logger.startGroup('Cart Store: Clearing Cart')
    try {
      logger.info('Clearing cart')
      state.items = []
      state.discountType = 'fixed'
      state.discountValue = 0
      state.notes = ''
      state.selectedTables = []
      state.holdInvoiceId = null
      state.holdOrderDescription = null
      state.type = null // Clear type when clearing cart
    } catch (error) {
      logger.error('Failed to clear cart:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  loadInvoice(state, invoice) {
    logger.startGroup('Cart Store: Loading Invoice')
    try {
      // Clear existing cart first
      this.clearCart(state)
        
      // Set editing invoice details
      state.editingInvoiceId = invoice.id
      state.editingInvoiceNumber = invoice.invoice_number
      state.editingInvoiceStatus = invoice.status
      
      // Preserve customer and contact information
      state.customer = {
        id: invoice.customer?.id || invoice.user_id,
        name: invoice.contact?.name || invoice.customer?.name || invoice.name,
        email: invoice.contact?.email || invoice.customer?.email || invoice.email,
        phone: invoice.contact?.phone || invoice.customer?.phone || invoice.phone
      }
      
      state.contact = invoice.contact || null
      console.log('Impresion de Articulos')
      console.log('invoice', invoice)
      // Log incoming invoice data
      logger.info('Loading invoice data:', {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer: state.customer,
        contact: state.contact,
        items: invoice.items.map(item => ({
          id: item.item_id,
          price: item.price,
          quantity: item.quantity,
          total: item.total
        }))
      })

      // Load items with pos_status preservation
      state.items = invoice.items.map(item => {
        // Normalize prices from backend (e.g., 14900 becomes 149)
        const itemPrice = item.price > 1000 ? item.price / 100 : item.price
        const itemQuantity = parseInt(item.quantity)
        const itemTotal = itemPrice * itemQuantity
        
        logger.info('Processing invoice item:', {
          id: item.item_id,
          name: item.name,
          price: itemPrice,
          formatted_price: PriceUtils.format(itemPrice),
          quantity: itemQuantity,
          total: itemTotal,
          formatted_total: PriceUtils.format(itemTotal),
          pos_status: item.pos_status || 'P' // Log status
        })

        return {
          id: item.item_id,
          name: item.name,
          description: item.description || '',
          price: itemPrice,
          quantity: itemQuantity,
          unit_name: item.unit_name || 'units',
          tax: item.tax || 0,
          total: itemTotal,
          sub_total: itemTotal,
          discount_type: item.discount_type || 'fixed',
          discount: item.discount || 0,
          discount_val: item.discount_val || 0,
          fromExistingOrder: true, // Mark as existing order item
          pos_status: item.pos_status || 'P', // Preserve item status
          section_id: item.section_id,
          section_type: item.section_type,
          fromHeldOrder: true
        }
      })

      // Set order level pos_status
      state.pos_status = invoice.pos_status || 'P'

      // Set other invoice properties
      state.notes = invoice.notes || ''
      state.type = invoice.type || null
      state.discountType = invoice.discount_type || 'fixed'
      state.discountValue = invoice.discount_val || 0

      logger.info('Invoice loaded into cart:', {
        itemCount: state.items.length,
        type: state.type,
        discount: { 
          type: state.discountType, 
          value: state.discountValue,
          formatted: PriceUtils.format(state.discountValue)
        },
        items: state.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          formatted_price: PriceUtils.format(item.price),
          quantity: item.quantity,
          total: item.total,
          formatted_total: PriceUtils.format(item.total)
        }))
      })
    } catch (error) {
      logger.error('Failed to load invoice into cart:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  async updateInvoice(state) {
    logger.startGroup('Cart Store: Updating Invoice')
    const companyStore = useCompanyStore()
    try {
      if (!state.editingInvoiceId) {
        throw new Error('No invoice being edited')
      }

      if (!state.items || state.items.length === 0) {
        throw new Error('Cannot update invoice: Cart is empty')
      }

      // Get current date and due date
      const currentDate = new Date()
      const dueDate = new Date(currentDate)
      dueDate.setDate(dueDate.getDate() + 7)

      // Calculate subtotal first to use in other calculations
      const subtotal = state.items.reduce((sum, item) => {
        // Use toCents to ensure correct conversion
        const itemPrice = PriceUtils.toCents(item.price)
        const itemQuantity = Math.round(Number(item.quantity))
        return sum + (itemPrice * itemQuantity)
      }, 0)

      // Calculate discount
      const discountAmount = state.discountType === '%'
        ? Math.round(subtotal * (state.discountValue / 100))
        : PriceUtils.normalizePrice(state.discountValue)

      // Calculate tax
      const taxableAmount = subtotal - discountAmount
      const totalTax = Math.round(taxableAmount * state.taxRate)

      // Calculate final total
      const totalAmount = taxableAmount + totalTax

      // Get customer and contact information from state
      const customer = state.customer || {}
      const contact = state.contact || {}

      // Map items with preserved status and proper item_id field
      const mappedItems = state.items.map(item => {
        const itemPrice = PriceUtils.normalizePrice(item.price)
        const itemQuantity = Math.round(Number(item.quantity))
        const itemSubtotal = itemPrice * itemQuantity
        const itemTax = Math.round(itemSubtotal * state.taxRate)
  
        return {
          item_id: item.id, // Ensure item_id is set
          id: item.id,      // Keep original id as well
          name: item.name,
          description: item.description || '',
          price: itemPrice,
          quantity: itemQuantity,
          unit_name: item.unit_name || 'units',
          total: itemSubtotal,
          tax: itemTax,
          sub_total: itemSubtotal,
          discount_type: item.discount_type || 'fixed',
          discount: item.discount || 0,
          discount_val: item.discount_val || 0,
          // Preserve existing status or default to pending
          pos_status: item.fromExistingOrder ? item.pos_status : 'P',
          section_id: item.section_id,
          section_type: item.section_type
        }
      })

      // Prepare invoice data with all required fields
      const invoiceData = {
        // Basic invoice info
        invoice_number: state.editingInvoiceNumber,
        invoice_date: currentDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        
        // Amounts
        sub_total: subtotal,
        total: totalAmount,
        tax: totalTax,
        due_amount: totalAmount,
        
        // Items with proper formatting
        items: mappedItems,

        // Status and type
        status: state.editingInvoiceStatus || 'DRAFT',
        type: state.type,
        pos_status: state.pos_status || 'P', // Preserve order status or default to Pending
        type: state.type?.toUpperCase() || 'HOLD', // Ensure type is uppercase
        
        // Discount
        discount_type: state.discountType || 'fixed',
        discount: state.discountValue.toString(),
        discount_val: discountAmount,
        discount_per_item: "NO",

        // Additional required fields
        notes: state.notes || '',
        is_invoice_pos: 1,
        is_pdf_pos: true,
        avalara_bool: false,
        banType: true,
        package_bool: false,
        print_pdf: false,
        save_as_draft: false,
        send_email: false,
        not_charge_automatically: false,
        is_edited: 1,
        
        // Required IDs and customer information
        user_id: customer.id || companyStore.selectedCustomer?.id || 1,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        contact: contact, // Preserve the original contact information
        
        // Store and company information
        store_id: companyStore.selectedStore?.id || 1,
        cash_register_id: companyStore.selectedCashier?.id || 1,
        company_id: companyStore.company?.id || 1,
        invoice_template_id: 1,
        invoice_pbx_modify: 0,
        
        // Required arrays
        tables_selected: [],
        packages: [],
        taxes: [],

        // Additional required fields
        tip: "0",
        tip_type: "fixed", 
        tip_val: 0,
        retention: "NO",
        retention_total: 0,
        late_fee_amount: 0,
        late_fee_taxes: 0,
        pbx_service_price: 0,
        sent: 0,
        viewed: 0,
        
        // Additional mandatory fields
        tax_per_item: "NO",
        retention_active: "NO",
        retention_percentage: 0,
        retention_concept: null,
        retention_amount: 0,
        package_bool: 0,
        save_as_draft: 0,
        not_charge_automatically: 0
      }

      logger.debug('Updating invoice with data:', invoiceData)

      try {
        // Call API to update invoice
        const response = await posApi.invoice.update(state.editingInvoiceId, invoiceData)
        
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to update invoice')
        }

        // Clear editing state after successful update
        state.editingInvoiceId = null
        state.editingInvoiceNumber = null
        state.editingInvoiceStatus = null

        // Show success message
        window.toastr?.success('Invoice updated successfully')

        return response
      } catch (error) {
        // Show error message
        window.toastr?.error(error.message || 'Failed to update invoice')
        throw error
      }
    } catch (error) {
      logger.error('Failed to update invoice:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  }
}
