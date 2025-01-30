import { useCompanyStore } from '../company'
import { logger } from '../../utils/logger'
import { prepareItemsForApi, getCurrentDate, getDueDate } from './helpers'
import { PriceUtils } from '../../utils/price'
import { OrderType } from '../../types/order'
import { CartItem, HoldInvoiceItem, HoldInvoiceData, TableData } from '../../types/cart'

export const invoiceActions = {
  // Invoice preparation actions
  prepareInvoiceData(state, getters, { storeId, cashRegisterId, referenceNumber }) {
    logger.startGroup('Cart Store: Prepare Invoice Data')
    try {
      const companyStore = useCompanyStore()
      const currentCustomer = companyStore.currentCustomer

      if (!currentCustomer?.id) {
        throw new Error('Creator ID not found in current customer')
      }

      if (!storeId || !cashRegisterId) {
        logger.warn('Missing store or cashier ID:', { storeId, cashRegisterId })
      }

      const currentDate = getCurrentDate()
      const dueDate = getDueDate()
      const orderType = state.type || OrderType.DINE_IN // Use type directly from state with default

      // Format items with proper price conversions and type safety
      const items: HoldInvoiceItem[] = state.items.map((item: CartItem) => {
        // Log original price and description
        logger.debug('Processing item:', {
          itemId: item.id,
          itemName: item.name,
          description: item.description,
          originalPrice: item.price,
          isInDollars: PriceUtils.isInDollars(item.price)
        });

        const itemPrice = PriceUtils.ensureCents(item.price)
        const itemQuantity = parseInt(String(item.quantity))
        const itemTotal = itemPrice * itemQuantity

        // Log converted price and description
        logger.debug('Item processing result:', {
          itemId: item.id,
          name: item.name,
          description: item.description || '',
          originalPrice: item.price,
          convertedPrice: itemPrice,
          quantity: itemQuantity,
          total: itemTotal
        });

        return {
          item_id: Number(item.id),
          id: Number(item.id),
          name: item.name,
          description: item.description || '', // Ensure description is always a string
          price: itemPrice,
          quantity: itemQuantity,
          unit_name: item.unit_name || 'units',
          sub_total: itemTotal,
          total: itemTotal,
          discount: "0",
          discount_val: 0,
          discount_type: "fixed",
          tax: PriceUtils.ensureCents(item.tax || 0),
          retention_amount: 0,
          retention_concept: null,
          retention_percentage: null,
          retentions_id: null,
          section_id: item.section_id,
          section_type: item.section_type,
          section_name: item.section_name
        }
      })

      // Log final items array with descriptions
      logger.debug('Final items array:', items.map(item => ({
        id: item.item_id,
        name: item.name,
        description: item.description,
        price: item.price,
        formattedPrice: PriceUtils.format(item.price),
        total: item.total,
        formattedTotal: PriceUtils.format(item.total)
      })));

      const invoice = {
        print_pdf: false,
        is_invoice_pos: 1,
        is_pdf_pos: true,
        avalara_bool: false,
        send_email: false,
        save_as_draft: false,
        not_charge_automatically: false,
        package_bool: false,
        invoice_date: currentDate,
        due_date: dueDate,
        invoice_number: referenceNumber || "-",
        user_id: Number(currentCustomer.id),
        total: PriceUtils.ensureCents(getters.total),
        due_amount: PriceUtils.ensureCents(getters.total),
        sub_total: PriceUtils.ensureCents(getters.subtotal),
        tax: PriceUtils.ensureCents(getters.taxAmount),
        discount_type: state.discountType,
        discount: state.discountValue.toString(),
        discount_val: PriceUtils.ensureCents(getters.discountAmount),
        discount_per_item: "NO",
        items,
        invoice_template_id: 1,
        banType: true,
        invoice_pbx_modify: 0,
        packages: [],
        cash_register_id: Number(cashRegisterId) || 1,
        store_id: Number(storeId) || 1,
        company_id: Number(companyStore.company?.id) || 1,
        taxes: {},
        notes: state.notes,
        contact: {},
        description: state.holdOrderDescription || referenceNumber,
        retention_total: 0,
        retention: "NO",
        status: "SENT",
        paid_status: "UNPAID",
        tax_per_item: "NO",
        send_sms: state.type === OrderType.DELIVERY ? (state.sendSms ? 1 : 0) : 0,
        late_fee_amount: 0,
        late_fee_taxes: 0,
        pbx_service_price: 0,
        sent: 0,
        viewed: 0,
        is_prepared_data: true,
        type: orderType // Add type directly to invoice data
      }

      if (state.holdInvoiceId) {
        invoice.hold_invoice_id = Number(state.holdInvoiceId)
        invoice.is_hold_invoice = true
      }

      // Only add tables for DINE IN orders
      if (orderType === OrderType.DINE_IN) {
        if (state.selectedTables?.length > 0) {
          const formattedTables = state.selectedTables.map(table => ({
            id: table.id,
            table_id: table.id,
            name: table.name,
            quantity: table.quantity,
            in_use: 1
          }))
          invoice.tables_selected = formattedTables
          invoice.hold_tables = formattedTables
        } else {
          invoice.tables_selected = []
          invoice.hold_tables = []
        }
      }

      logger.info('Invoice data prepared:', invoice)
      return invoice
    } catch (error) {
      logger.error('Failed to prepare invoice data:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  },

  prepareHoldInvoiceData(state, getters, { storeId, cashRegisterId, referenceNumber }): HoldInvoiceData {
    logger.startGroup('Cart Store: Prepare Hold Invoice Data')
    try {
      const data = this.prepareInvoiceData(state, getters, { storeId, cashRegisterId, referenceNumber })
      
      // Log items with descriptions before creating hold invoice
      logger.debug('Items for hold invoice:', data.items.map(item => ({
        id: item.item_id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity
      })))

      const holdData: HoldInvoiceData = {
        ...data,
        is_hold_invoice: true,
        hold_invoice_id: null,
        // Ensure both table arrays are present in hold invoice
        tables_selected: data.tables_selected || [],
        hold_tables: data.tables_selected || [] // Use same data for both arrays
      }

      logger.debug('Final hold invoice data:', {
        itemCount: holdData.items.length,
        items: holdData.items.map(item => ({
          id: item.item_id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity
        }))
      })

      return holdData
    } catch (error) {
      logger.error('Error preparing hold invoice data:', error)
      throw error
    } finally {
      logger.endGroup()
    }
  }
}
