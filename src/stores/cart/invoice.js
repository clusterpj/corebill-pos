import { useCompanyStore } from '../company'
import { logger } from '../../utils/logger'
import { prepareItemsForApi, getCurrentDate, getDueDate } from './helpers'
import { PriceUtils } from '../../utils/price'
import { OrderType } from '../../types/order'
import { validateTaxData } from '../../services/api/pos-operations/utils'
import { useTaxTypesStore } from '../tax-types'

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

      // Format items with proper price conversions
      const items = state.items.map(item => {
        // Log original price
        logger.debug('Processing item price:', {
          itemId: item.id,
          itemName: item.name,
          originalPrice: item.price,
          isInDollars: PriceUtils.isInDollars(item.price)
        });

        const itemPrice = PriceUtils.ensureCents(item.price)
        const itemQuantity = parseInt(item.quantity)
        const itemTotal = itemPrice * itemQuantity

        // Log converted price
        logger.debug('Price conversion result:', {
          itemId: item.id,
          originalPrice: item.price,
          convertedPrice: itemPrice,
          quantity: itemQuantity,
          total: itemTotal
        });

        return {
          item_id: Number(item.id),
          name: item.name,
          description: item.description || '',
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
          retentions_id: null
        }
      })

      // Log final items array
      logger.debug('Final items array:', items.map(item => ({
        id: item.item_id,
        name: item.name,
        price: item.price,
        formattedPrice: PriceUtils.format(item.price),
        total: item.total,
        formattedTotal: PriceUtils.format(item.total)
      })));

      const taxTypesStore = useTaxTypesStore()
      const taxTypes = taxTypesStore.availableTaxTypes
      const baseAmount = getters.subtotal - getters.discountAmount

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
        items: items,
        invoice_template_id: 1,
        banType: true,
        invoice_pbx_modify: 0,
        packages: [],
        cash_register_id: Number(cashRegisterId) || 1,
        store_id: Number(storeId) || 1,
        company_id: Number(companyStore.company?.id) || 1,
        taxes: taxTypes.map(tax => ({
          tax_type_id: Number(tax.id),
          company_id: Number(tax.company_id),
          name: tax.name,
          amount: calculateTaxAmount(baseAmount, tax.percent),
          percent: Number(tax.percent),
          compound_tax: Number(tax.compound_tax),
          estimate_id: null,
          invoice_item_id: null,
          estimate_item_id: null,
          item_id: null
        })),
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

  prepareHoldInvoiceData(state, getters, { storeId, cashRegisterId, referenceNumber }) {
    const data = this.prepareInvoiceData(state, getters, { storeId, cashRegisterId, referenceNumber })
    return {
      ...data,
      is_hold_invoice: true,
      hold_invoice_id: null,
      // Ensure taxes array is properly copied over
      taxes: Array.isArray(data.taxes) ? data.taxes : [],
      // Ensure both table arrays are present in hold invoice
      tables_selected: data.tables_selected || [],
      hold_tables: data.tables_selected || [] // Use same data for both arrays
    }
  }
}

function calculateTaxAmount(baseAmount, taxPercent) {
  const taxRate = taxPercent / 100
  return Math.round(baseAmount * taxRate)
}
