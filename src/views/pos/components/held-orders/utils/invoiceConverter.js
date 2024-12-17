import { posApi } from '../../../../../services/api/pos-api'
import { logger } from '../../../../../utils/logger'
import { formatApiDate, toCents } from './formatters'
import { validateInvoiceData, validateInvoiceForConversion } from './validators'
import { OrderType, PaidStatus } from '../../../../../types/order'

export const convertHeldOrderToInvoice = async (invoice) => {
  // Validate invoice object structure
  if (!invoice || typeof invoice !== 'object') {
    throw new Error('Invalid invoice data provided')
  }

  // For nested invoice structure, extract the inner invoice
  if (invoice.invoice && typeof invoice.invoice === 'object') {
    invoice = invoice.invoice
  }

  // Now check for ID
  if (!invoice.id) {
    const error = new Error('Invalid invoice: missing ID')
    logger.error('[InvoiceConverter] Invalid invoice data:', { invoice })
    throw error
  }

  logger.info('[InvoiceConverter] Starting conversion process:', {
    id: invoice.id,
    description: invoice.description,
    total: invoice.total,
    items: invoice.hold_items?.length
  })
  
  try {
    // Ensure we have a valid invoice object
    if (!invoice || typeof invoice !== 'object') {
      throw new Error('Invalid invoice data provided')
    }

    logger.debug('Starting invoice conversion with data:', {
      id: invoice.id,
      type: invoice.type,
      items: invoice.hold_items?.length || 0
    })

    // Ensure items array exists
    if (!invoice.items && invoice.hold_items) {
      invoice.items = invoice.hold_items
    } else if (!invoice.items) {
      invoice.items = []
    }

    // Skip validation since we know the invoice is valid
    // 1. Get company settings
    console.log('Fetching company settings')
    const settings = await posApi.getCompanySettings()
    console.log('Company settings received:', settings)

    // Validate required settings
    if (!settings.invoice_auto_generate) {
      throw new Error('Invoice auto-generate setting is required but missing')
    }

    // Use default issuance period if not set
    const issuancePeriod = settings.invoice_issuance_period || '7'

    // 2. Get next invoice number if auto-generate is enabled
    let invoiceNumber
    if (settings.invoice_auto_generate === 'YES') {
      console.log('Getting next invoice number')
      const nextNumberResponse = await posApi.invoice.getNextNumber()
      console.log('Next number response:', nextNumberResponse)

      if (!nextNumberResponse?.invoice_number) {
        throw new Error('Failed to get next invoice number')
      }
      // Add hyphen between prefix and number
      invoiceNumber = `${nextNumberResponse.prefix}-${nextNumberResponse.nextNumber}`
    } else {
      throw new Error('Manual invoice number entry is not supported')
    }

    // Calculate dates
    const currentDate = new Date()
    const dueDate = new Date(currentDate)
    dueDate.setDate(dueDate.getDate() + parseInt(issuancePeriod))

    // Parse table data from notes
    let tableData = {}
    try {
      if (invoice.notes) {
        tableData = JSON.parse(invoice.notes)
      }
    } catch (err) {
      console.error('Failed to parse table data from notes:', err)
    }

    // Format items according to API requirements
    console.log('Formatting items data')
    const formattedItems = invoice.items.map(item => {
      // Price is already in cents from prepareHoldInvoiceData
      const itemPrice = Math.round(Number(item.price))
      const itemQuantity = parseInt(item.quantity)
      const itemTotal = itemPrice * itemQuantity

      return {
        item_id: Number(item.item_id),
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
        tax: Math.round(Number(item.tax || 0)), // Tax is also already in cents
        retention_amount: 0,
        retention_concept: null,
        retention_percentage: null,
        retentions_id: null
      }
    })

    // Format tip value - ensure it's a clean number string
    const tipValue = invoice.tip ? String(Math.round(Number(invoice.tip))) : "0"
    console.log('Formatted tip value:', tipValue)

    // 3. Prepare invoice data according to API requirements
    console.log('Preparing invoice data')
    console.log('Invoice data', invoice)

    // Ensure all required numeric fields are present and properly formatted
    const subTotal = Math.round(Number(invoice.sub_total || 0))
    const taxAmount = Math.round(Number(invoice.tax || 0))
    const totalAmount = Math.round(Number(invoice.total || (subTotal + taxAmount)))

    const invoiceData = {
      // Required fields first
      invoice_date: formatApiDate(currentDate),
      due_date: formatApiDate(dueDate),
      invoice_number: invoiceNumber,
      sub_total: subTotal,
      total: totalAmount,
      tax: taxAmount,
      items: formattedItems, // This is prepared earlier in the code

      // Ensure tables arrays are present for all order types
      tables_selected: invoice.tables_selected || [],
      hold_tables: invoice.hold_tables || [],
      
      // Required boolean flags
      avalara_bool: false,
      banType: true,
      package_bool: false,
      print_pdf: false,
      save_as_draft: false,
      send_email: false,
      not_charge_automatically: false,
      is_hold_invoice: true,
      is_invoice_pos: 1,
      is_pdf_pos: settings.pdf_format_pos === '1',
      is_prepared_data: true,

      // IDs and references
      invoice_template_id: 1,
      invoice_pbx_modify: 0,
      hold_invoice_id: Math.round(Number(invoice.id || 0)),
      store_id: Math.round(Number(invoice.store_id || 0)),
      cash_register_id: Math.round(Number(invoice.cash_register_id || 0)),
      user_id: Math.round(Number(invoice.user_id || 1)),

      // Amounts
      due_amount: Math.round(Number(totalAmount)),
      
      // Discount
      discount: String(Math.round(Number(invoice.discount || 0))),
      discount_type: invoice.discount_type || "fixed",
      discount_val: Math.round(Number(toCents(invoice.discount_val || 0))),
      discount_per_item: settings.discount_per_item || "NO",

      // Tip - ensure consistent formatting
      tip: tipValue,
      tip_type: invoice.tip_type || "fixed",
      tip_val: invoice.tip_val || 0,

      // Status
      status: "SENT",
      paid_status: invoice.paid_status || PaidStatus.UNPAID,
      type: invoice.type || OrderType.TO_GO,

      // Arrays
      items: formattedItems,
      taxes: invoice.taxes || [],
      packages: [],
      tables_selected: tableData.tables || [],

      // Optional fields
      notes: '',
      description: invoice.description || `Order #${invoice.id}`
    }

    // Validate invoice data before sending
    validateInvoiceData(invoiceData)

    console.log('Creating invoice with data:', invoiceData)

    // 4. Create the invoice
    const invoiceResponse = await posApi.invoice.create(invoiceData)
    console.log('Invoice creation response:', invoiceResponse)
    
    // If we have an invoice object with an ID, consider it successful
    if (invoiceResponse?.result?.invoice?.id) {
      invoiceResponse.invoice = invoiceResponse.result.invoice
    } else if (invoiceResponse?.invoice?.id) {
      // Keep existing invoice structure
    } else {
      throw new Error('Failed to create invoice: No valid invoice ID')
    }

    // Add hold_invoice_id to the response
    invoiceResponse.invoice.hold_invoice_id = invoice.id

    // 5. Get created invoice details
    console.log('Fetching created invoice details')
    const createdInvoice = await posApi.invoice.getById(invoiceResponse.invoice.id)
    if (!createdInvoice) {
      throw new Error('Failed to fetch created invoice details')
    }

    // Normalize tip value in the response to match what we sent
    if (createdInvoice.tip) {
      createdInvoice.tip = String(Math.round(Number(createdInvoice.tip)))
    }

    // Add hold_invoice_id to the created invoice
    createdInvoice.hold_invoice_id = invoice.id

    console.log('Created invoice details:', createdInvoice)

    logger.info('Order converted to invoice successfully:', createdInvoice.id)
    return {
      success: true,
      invoice: createdInvoice
    }
  } catch (error) {
    console.error('Failed to convert order to invoice:', error)
    logger.error('Failed to convert order to invoice:', error)
    window.toastr?.['error'](error.message || 'Failed to convert order to invoice')
    return {
      success: false,
      error: error.message
    }
  }
}
