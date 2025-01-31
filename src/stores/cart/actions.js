import { logger } from '../../utils/logger'
import { PriceUtils } from '../../utils/price'
import { posApi } from '../../services/api/pos-api'
import { useCompanyStore } from '../company'
import { useTaxTypesStore } from '../tax-types'

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
          section_name: product.section_name,
          description: product.description || '' // Ensure description is included
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

      // Log incoming invoice data
      logger.info('Loading invoice data:', {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer: state.customer,
        contact: state.contact,
        itemCount: invoice.hold_items?.length || invoice.items?.length || 0
      })

      // Determine which items array to use (hold_items for held orders, items for regular invoices)
      const itemsToLoad = invoice.hold_items || invoice.items || []

      // Load items with pos_status preservation, keeping them as separate entities
      state.items = itemsToLoad.map(item => {
        // Normalize price if needed (only if not from held order)
        const itemPrice = item.fromHeldOrder ? item.price : (item.price > 1000 ? item.price / 100 : item.price)
        const itemQuantity = parseFloat(item.quantity) || 1
        const itemTotal = itemPrice * itemQuantity
        
        logger.info('Processing invoice item:', {
          id: item.id,
          item_id: item.item_id,
          name: item.name,
          description: item.description,
          price: itemPrice,
          formatted_price: PriceUtils.format(itemPrice),
          quantity: itemQuantity,
          total: itemTotal,
          formatted_total: PriceUtils.format(itemTotal),
          pos_status: item.pos_status || 'P'
        })

        return {
          id: item.item_id || item.id,  // Use item_id for held orders, fallback to id
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
          fromExistingOrder: true,
          pos_status: item.pos_status || 'P',
          section_id: item.section_id,
          section_type: item.section_type,
          fromHeldOrder: true,
          // Preserve the original item ID for reference
          original_item_id: item.id,
          // Keep any custom fields that were in the original item
          ...item.custom_fields
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
        }
      })
    } catch (error) {
      logger.error('Failed to load invoice:', error)
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

      // Calculate totals with proper precision
      const subtotal = state.items.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + (itemPrice * itemQuantity)
      }, 0)

      // Calculate discount without rounding
      const discountAmount = state.discountType === '%'
        ? (subtotal * (parseFloat(state.discountValue) / 100))
        : parseFloat(state.discountValue) || 0

      // Get available tax types and calculate total tax
      const taxTypesStore = useTaxTypesStore()
      const availableTaxes = taxTypesStore.availableTaxTypes || []
      
      // Calculate taxable amount
      const taxableAmount = subtotal - discountAmount
      
      // Calculate tax for each tax type
      const taxes = availableTaxes.map(tax => ({
        id: tax.id,
        name: tax.name,
        rate: tax.percent / 100,
        amount: Math.round(taxableAmount * (tax.percent / 100))
      }))
      
      // Sum up all tax amounts
      const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0)
      const totalAmount = taxableAmount + totalTax

      // Map items preserving full precision
      const mappedItems = state.items.map(item => ({
        item_id: item.id,
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: parseFloat(item.price),
        quantity: parseFloat(item.quantity),
        unit_name: item.unit_name || 'units',
        total: parseFloat(item.price) * parseFloat(item.quantity),
        tax: (parseFloat(item.price) * parseFloat(item.quantity)) * (parseFloat(state.taxRate) || 0),
        sub_total: parseFloat(item.price) * parseFloat(item.quantity),
        discount_type: item.discount_type || 'fixed',
        discount: parseFloat(item.discount) || 0,
        discount_val: parseFloat(item.discount_val) || 0,
        pos_status: item.fromExistingOrder ? item.pos_status : 'P',
        section_id: item.section_id,
        section_type: item.section_type
      }))

      const customer = state.customer || {}
      const contact = state.contact || {}

      // Define a safe fallback for taxTypes
      const taxTypes = state.taxTypes || []

      const invoiceData = {
        invoice_number: state.editingInvoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        
        // Use full precision numbers
        sub_total: subtotal,
        total: totalAmount,
        tax: totalTax,
        due_amount: totalAmount,
        
        items: mappedItems,
        status: state.editingInvoiceStatus || 'DRAFT',
        pos_status: state.pos_status || 'P',
        type: state.type?.toUpperCase() || 'HOLD',
        
        discount_type: state.discountType || 'fixed',
        discount: state.discountValue?.toString() || '0',
        discount_val: discountAmount,
        discount_per_item: "NO",

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
        
        user_id: customer.id || companyStore.selectedCustomer?.id || 1,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        contact: contact,
        
        store_id: companyStore.selectedStore?.id || 1,
        cash_register_id: companyStore.selectedCashier?.id || 1,
        company_id: companyStore.company?.id || 1,
        invoice_template_id: 1,
        invoice_pbx_modify: 0,
        
        tables_selected: [],
        packages: [],
        taxes: taxes.map(tax => ({
          tax_type_id: tax.id,
          company_id: companyStore.company?.id || 1,
          name: tax.name,
          amount: tax.amount,
          percent: tax.rate * 100,
          compound_tax: 0,
          estimate_id: null,
          invoice_item_id: null,
          estimate_item_id: null,
          item_id: null
        })),
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

      const response = await posApi.invoice.update(state.editingInvoiceId, invoiceData)
      
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update invoice')
      }

      state.editingInvoiceId = null
      state.editingInvoiceNumber = null
      state.editingInvoiceStatus = null

      window.toastr?.success('Invoice updated successfully')
      return response

    } catch (error) {
      window.toastr?.error(error.message || 'Failed to update invoice')
      logger.error('Failed to update invoice:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  }
}
