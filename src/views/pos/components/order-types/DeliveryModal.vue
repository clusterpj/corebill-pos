<template>
  <v-dialog 
    v-model="dialog" 
    fullscreen
    transition="dialog-bottom-transition"
    :scrim="false"
  >
    <DeliveryPaymentDialog
      v-model="showPaymentDialog"
      :invoice="invoiceData"
      @payment-complete="onPaymentComplete"
    />
    <template v-slot:activator="{ props: dialogProps }">
      <v-btn
        color="primary"
        v-bind="dialogProps"
        prepend-icon="mdi-truck-delivery"
        :loading="loading"
        :disabled="disabled || cartStore.isEmpty"
        class="text-none px-6"
        rounded="pill"
        :elevation="$vuetify.display.mobile ? 1 : 2"
        size="large"
        :block="$vuetify.display.mobile"
      >
        <span class="text-subtitle-1 font-weight-medium">DELIVERY</span>
      </v-btn>
    </template>

    <v-card class="modal-card">
      <v-toolbar 
        color="primary"
        density="comfortable"
      >
        <v-toolbar-title class="text-h6 font-weight-medium">
          <v-icon icon="mdi-truck-delivery" size="large" class="mr-2"></v-icon>
          Delivery Order
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="closeModal"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 fill-height d-flex flex-column">
        <v-container fluid class="flex-grow-1 pa-4">
          <!-- Loading State -->
          <v-row v-if="loading">
            <v-col cols="12" class="text-center">
              <v-progress-circular indeterminate size="64"></v-progress-circular>
            </v-col>
          </v-row>

          <!-- Error State -->
          <v-row v-else-if="error">
            <v-col cols="12" class="text-center">
              <v-alert type="error" variant="tonal">
                {{ error }}
              </v-alert>
            </v-col>
          </v-row>

          <!-- Delivery Information Form -->
          <template v-else>
            <!-- Customer Information Section -->
            <v-row>
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">Customer Information</div>
                <v-autocomplete
                  v-model="selectedCustomer"
                  v-model:search="customerSearch"
                  :items="searchResults"
                  :loading="isSearching"
                  :error-messages="validationErrors.name"
                  label="Search Customer"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  persistent-hint
                  hint="Search by name, phone, or email (min. 3 characters)"
                  return-object
                  @update:search="onCustomerSearch"
                  @update:model-value="onCustomerSelect"
                >
                  <template v-slot:append-inner>
                    <v-icon
                      v-if="selectedCustomer"
                      color="error"
                      @click.stop="clearSelectedCustomer"
                    >
                      mdi-close
                    </v-icon>
                  </template>
                  <template v-slot:no-data>
                    <v-list-item>
                      <v-list-item-title>
                        No customers found
                      </v-list-item-title>
                      <template v-slot:append>
                        <v-btn
                          color="primary"
                          variant="text"
                          @click="showCreateCustomer = true"
                        >
                          Create New
                        </v-btn>
                      </template>
                    </v-list-item>
                  </template>
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ item.raw.phone || 'No phone' }}
                        {{ item.raw.email ? `• ${item.raw.email}` : '' }}
                      </v-list-item-subtitle>
                      <v-list-item-subtitle v-if="item.raw.address_street_1">
                        {{ item.raw.address_street_1 }}
                        {{ item.raw.address_street_2 ? `, ${item.raw.address_street_2}` : '' }}
                        {{ item.raw.city ? `, ${item.raw.city}` : '' }}
                        {{ item.raw.state ? ` ${item.raw.state}` : '' }}
                        {{ item.raw.zip_code ? ` ${item.raw.zip_code}` : '' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-autocomplete>

                <CreateCustomerDialog
                  v-model="showCreateCustomer"
                  @customer-created="onCustomerCreated"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="customerInfo.phone"
                  label="Phone Number"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="validationErrors.phone"
                  @input="clearError('phone')"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Delivery Address Section -->
            <v-row>
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">Delivery Address</div>
                <v-text-field
                  v-model="customerInfo.address"
                  label="Street Address"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="validationErrors.address"
                  @input="clearError('address')"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="customerInfo.unit"
                  label="Apt/Suite/Unit (Optional)"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="customerInfo.zipCode"
                  label="ZIP Code"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="validationErrors.zipCode"
                  @input="clearError('zipCode')"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="customerInfo.city"
                  label="City"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="validationErrors.city"
                  @input="clearError('city')"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <StateDropdown
                  v-model="customerInfo.state"
                  :error="validationErrors.state"
                  @state-selected="onStateSelect"
                  @update:model-value="clearError('state')"
                />
              </v-col>
            </v-row>

            <!-- Delivery Instructions -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="customerInfo.instructions"
                  label="Delivery Instructions (Optional)"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  hint="Special instructions for delivery driver"
                ></v-textarea>
              </v-col>
            </v-row>

            <!-- SMS Toggle -->
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="sendSms"
                  color="primary"
                  label="Send invoice via SMS"
                  hint="Customer will receive an SMS with the invoice link"
                  persistent-hint
                ></v-switch>
              </v-col>
            </v-row>

            <!-- Submit Button -->
            <v-row class="mt-4">
              <v-col cols="12">
                <v-btn
                  color="primary"
                  size="large"
                  block
                  height="56"
                  @click="processOrder"
                  :loading="processing"
                  :disabled="!canProcessOrder || processing"
                  elevation="2"
                >
                  <v-icon start>mdi-check-circle</v-icon>
                  Process Order
                </v-btn>
              </v-col>
            </v-row>
          </template>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import StateDropdown from '@/components/common/StateDropdown.vue'
import CreateCustomerDialog from '../customer/CreateCustomerDialog.vue'
import DeliveryPaymentDialog from '../dialogs/DeliveryPaymentDialog.vue'
import { useOrderType } from '../../composables/useOrderType'
import { useCustomerSearch } from '../../composables/useCustomerSearch'
import { usePosStore } from '@/stores/pos-store'
import { useCartStore } from '@/stores/cart-store'
import { useCompanyStore } from '@/stores/company'
import { useKitchenStore } from '@/stores/kitchen'
import { logger } from '../../../../utils/logger'
import { apiClient } from '@/services/api/client'
import { posApi } from '@/services/api/pos-api'
import { convertHeldOrderToInvoice } from '../held-orders/utils/invoiceConverter'
import { PriceUtils } from '@/utils/price'
import { parseOrderNotes } from '../../../../stores/cart/helpers'
import { OrderType } from '../../../../types/order'

const { customerNotes } = useOrderType()
// Computed properties for store and cashier
const selectedStore = computed(() => companyStore.selectedStore)
const selectedCashier = computed(() => companyStore.selectedCashier)

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

// Store access
const posStore = usePosStore()
const cartStore = useCartStore()
const companyStore = useCompanyStore()
const kitchenStore = useKitchenStore()
const kitchenStore = useKitchenStore()

// Composables
const { 
  setOrderType, 
  processOrder: processOrderType, 
  ORDER_TYPES, 
  error: orderError,
  setCustomerInfo
} = useOrderType()

// Customer search integration
const { 
  searchResults,
  isSearching,
  searchError,
  searchCustomers,
  createCustomer
} = useCustomerSearch()

// Local state
const dialog = ref(false)
const loading = ref(false)
const processing = ref(false)
const sendSms = ref(false)
const showPaymentDialog = ref(false)
const error = computed(() => orderError.value || searchError.value)

const canProcessOrder = computed(() => {
  return !cartStore.isEmpty && 
         (customerInfo.name || '').trim() && 
         (customerInfo.phone || '').trim() && 
         (customerInfo.address || '').trim() && 
         (customerInfo.city || '').trim() && 
         (customerInfo.state || '').trim() && 
         (customerInfo.zipCode || '').trim()
})
const customerSearch = ref('')
const selectedCustomer = ref(null)
const showCreateCustomer = ref(false)

// Customer search handlers
const onCustomerSearch = async (search) => {
  customerSearch.value = search // Maintain search text
  if (search && search.length >= 3) {
    try {
      // Check if search is a phone number (contains only digits, spaces, dashes or parentheses)
      const isPhoneSearch = /^[\d\s\-()]+$/.test(search)
      // If it's a phone search, clean up the format before searching
      const searchTerm = isPhoneSearch ? search.replace(/[\s\-()]/g, '') : search
      
      // Get the search results
      const response = await apiClient.get('/v1/customers', {
        params: {
          search: searchTerm,
          status_customer: 'A',
          orderByField: 'created_at',
          orderBy: 'desc',
          page: 1
        }
      })
      
      // Extract and format the customers from the paginated response
      const customers = response.data.customers?.data || []
      
      // Update the search results with properly formatted data for v-autocomplete
      searchResults.value = customers.map(customer => {
        const displayName = customer.name || customer.customer_username || 'Unknown'
        const displayPhone = customer.phone ? customer.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'No phone'
        const displayEmail = customer.email ? ` • ${customer.email}` : ''
        
        return {
          ...customer,
          title: isPhoneSearch ? `${displayPhone} - ${displayName}` : displayName,
          subtitle: isPhoneSearch ? displayEmail : `${displayPhone}${displayEmail}`,
          value: customer.id
        }
      })
      
      logger.debug('Customer search results:', {
        searchTerm,
        isPhoneSearch,
        results: searchResults.value
      })
    } catch (error) {
      logger.error('Customer search failed:', error)
      searchResults.value = []
    }
  } else {
    searchResults.value = []
  }
}

const onCustomerSelect = async (customer) => {
  if (customer) {
    logger.debug('Customer selected:', customer)

    try {
      // Fetch full customer details including addresses
      const response = await apiClient.get(`/v1/customers/${customer.id}`, {
        params: {
          include: 'billing_address,addresses'
        }
      })
      
      const fullCustomer = response.data.customer
      const billingAddress = fullCustomer.billing_address || {}
      
      logger.debug('Full customer data:', fullCustomer)
      logger.debug('Billing address:', billingAddress)

      // Populate all available customer information with null checks
      customerInfo.name = fullCustomer?.name?.trim() || fullCustomer?.first_name?.trim() || ''
      customerInfo.phone = fullCustomer?.phone?.trim() || ''
      customerInfo.email = fullCustomer?.email?.trim() || ''
      
      // Set address information from billing address with null checks
      customerInfo.address = billingAddress?.address_street_1?.trim() || ''
      customerInfo.unit = billingAddress?.address_street_2?.trim() || ''
      customerInfo.city = billingAddress?.city?.trim() || ''
      customerInfo.zipCode = billingAddress?.zip?.trim() || ''
      
      // Handle state information
      if (billingAddress.state) {
        customerInfo.state = billingAddress.state.code || ''
        customerInfo.state_id = billingAddress.state.id || null
      } else {
        customerInfo.state = ''
        customerInfo.state_id = null
      }
    
      customerInfo.instructions = customer.notes || ''
      
      // Keep the search value after selection
      customerSearch.value = customer.name
      
      // Log the populated data for debugging
      logger.debug('Customer selected:', customer)
      logger.debug('Billing address:', billingAddress)
      logger.info('Customer data populated:', { 
        customer: customer.id,
        fields: { ...customerInfo }
      })

      // Clear any existing validation errors
      clearAllErrors()
    } catch (error) {
      logger.error('Error fetching customer details:', error)
      if (window.toastr) {
        window.toastr.error('Failed to load customer details')
      }
    }
  }
}

const clearSelectedCustomer = () => {
  selectedCustomer.value = null
  customerSearch.value = ''
  Object.keys(customerInfo).forEach(key => {
    customerInfo[key] = ''
  })
}

const onCustomerCreated = async (customer) => {
  try {
    logger.info('New customer created:', customer)
    
    // Close the create customer dialog
    showCreateCustomer.value = false
    
    // Set the selected customer and populate the form
    selectedCustomer.value = customer
    customerSearch.value = customer.name
    
    // Populate delivery form with customer data
    customerInfo.name = customer.name
    customerInfo.phone = customer.phone || ''
    customerInfo.email = customer.email || ''
    customerInfo.address = customer.address_street_1 || ''
    customerInfo.unit = customer.address_street_2 || ''
    customerInfo.city = customer.city || ''
    customerInfo.state = customer.state || ''
    customerInfo.zipCode = customer.zip || ''
    customerInfo.instructions = customer.notes || ''
    
    // Clear any existing validation errors
    clearAllErrors()
    
    // Show success message
    if (window.toastr) {
      window.toastr.success('Customer created and loaded successfully')
    }
  } catch (error) {
    logger.error('Error handling new customer:', error)
    if (window.toastr) {
      window.toastr.error('Error loading customer data')
    }
  }
}

const updateNotes = (value) => {
  try {
    // If there are existing notes in the cart, parse them first
    let existingNotes = {}
    try {
      if (cartStore.notes) {
        existingNotes = JSON.parse(cartStore.notes)
      }
    } catch (e) {
      logger.warn('Failed to parse existing notes:', e)
    }

    // Create new notes object, preserving existing data
    const notesObj = {
      ...existingNotes,
      customerNotes: value,
      timestamp: new Date().toISOString(),
      orderType: OrderType.DELIVERY,
      orderInfo: {
        ...existingNotes.orderInfo,
        customer: {
          ...existingNotes.orderInfo?.customer,
          name: customerInfo.name.trim(),
          phone: customerInfo.phone.replace(/\D/g, ''),
          email: customerInfo.email.trim(),
          address: customerInfo.address,
          unit: customerInfo.unit,
          city: customerInfo.city,
          state: customerInfo.state,
          zipCode: customerInfo.zipCode,
          notes: value,
          instructions: value // Keep for backward compatibility
        }
      }
    }

    cartStore.setNotes(JSON.stringify(notesObj))
    logger.debug('Updated cart notes:', notesObj)
  } catch (error) {
    logger.error('Failed to update cart notes:', error)
  }
}

// Form state
const customerInfo = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  unit: '',
  city: '',
  state: '',
  zipCode: '',
  notes: ''
})

const onStateSelect = (state) => {
  customerInfo.state_id = state.id
  customerInfo.state = state.code
}

// Validation
const validationErrors = reactive({
  name: '',
  phone: '',
  address: '',
  zip: '',
  city: '',
  state: ''
})

// Watch for dialog open to set order type
watch(dialog, (newValue) => {
  if (newValue) {
    setOrderType(ORDER_TYPES.DELIVERY)
  } else {
    // Reset form when dialog closes
    Object.keys(customerInfo).forEach(key => {
      customerInfo[key] = ''
    })
    clearAllErrors()
  }
})

// Watch for dialog open to initialize notes
watch(dialog, (newValue) => {
  if (newValue) {
    if (!selectedStore.value || !selectedCashier.value) {
      error.value = 'Please select both store and cashier first'
      dialog.value = false
      return
    }
    
    // Initialize notes from cart store when dialog opens
    try {
      const notes = parseOrderNotes(cartStore.notes)
      if (notes) {
        customerInfo.notes = notes
        logger.debug('Initialized notes from cart store:', { notes })
      }
    } catch (error) {
      logger.error('Failed to parse cart notes:', error)
    }
  }
})

// Watch for changes in cart store notes
watch(() => cartStore.notes, (newNotes) => {
  try {
    const notes = parseOrderNotes(newNotes)
    if (notes && notes !== customerInfo.notes) {
      customerInfo.notes = notes
      logger.debug('Updated notes from cart store:', { notes })
    }
  } catch (error) {
    logger.error('Failed to parse cart notes:', error)
  }
})

// Watch for changes in customer notes
watch(() => customerNotes.value, (newNotes) => {
  if (newNotes !== customerInfo.notes) {
    customerInfo.notes = newNotes
    logger.debug('Updated notes from customer notes:', { newNotes })
  }
})

// Validation helper
const validateForm = () => {
  let isValid = true
  clearAllErrors()

  if (!selectedCustomer.value?.id) {
    validationErrors.name = 'Please select a customer from the search results'
    isValid = false
  }

  if (!customerInfo.phone.trim()) {
    validationErrors.phone = 'Phone number is required'
    isValid = false
  }

  if (!customerInfo.address.trim()) {
    validationErrors.address = 'Delivery address is required'
    isValid = false
  }

  return isValid
}

// Clear validation errors
const clearError = (field) => {
  validationErrors[field] = ''
}

const clearAllErrors = () => {
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key] = ''
  })
}

// Process the order
// Add reactive invoice data state
const invoiceData = ref({
  invoice: null,
  invoicePrefix: '',
  nextInvoiceNumber: ''
})

const processOrder = async () => {
  if (!validateForm()) return

  processing.value = true

  try {
    // Format full address
    const fullAddress = [
      customerInfo.address.trim(),
      customerInfo.unit.trim(),
      customerInfo.zipCode.trim()
    ].filter(Boolean).join(', ')

    // Update customer info in the order type composable
    const customerData = {
      customer_id: selectedCustomer.value?.id || null,
      name: (customerInfo.name || '').trim(),
      phone: (customerInfo.phone || '').trim(),
      address: (customerInfo.address || '').trim(),
      unit: (customerInfo.unit || '').trim(),
      zip: (customerInfo.zipCode || '').trim(),
      city: (customerInfo.city || '').trim(),
      state: (customerInfo.state || '').trim(),
      state_id: customerInfo.state_id,
      email: (customerInfo.email || '').trim(),
      instructions: (customerInfo.instructions || '').trim(),
      send_sms: sendSms.value ? 1 : 0
    }
    setCustomerInfo(customerData)

    // Get current date and due date
    const currentDate = new Date()
    const dueDate = new Date(currentDate)
    dueDate.setDate(dueDate.getDate() + 7) // Set due date to 7 days from now

    // Create invoice data with required fields
    const orderData = {
      // Required fields first
      invoice_date: currentDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      invoice_number: `DEL-${Date.now()}`, // Temporary invoice number
      sub_total: cartStore.subtotal, // Already in cents from the cart store
      total: cartStore.total, // Already in cents from the cart store
      tax: cartStore.taxAmount, // Already in cents from the cart store
      items: cartStore.items.map(item => ({
        item_id: item.id,
        name: item.name,
        description: item.description || '',
        price: PriceUtils.normalizePrice(item.price),
        quantity: item.quantity,
        unit_name: item.unit_name || 'units',
        total: PriceUtils.normalizePrice(item.total),
        sub_total: PriceUtils.normalizePrice(item.sub_total),
        tax: PriceUtils.normalizePrice(item.tax || 0)
      })),

      // Boolean flags
      avalara_bool: false,
      banType: true,
      package_bool: false,
      print_pdf: false,
      save_as_draft: false,
      send_email: false,
      not_charge_automatically: false,
      is_hold_invoice: true,
      is_invoice_pos: 1,
      is_pdf_pos: true,

      // IDs and references
      invoice_template_id: 1,
      invoice_pbx_modify: 0,
      store_id: companyStore.selectedStore?.id,
      cash_register_id: companyStore.selectedCashier?.id,
      user_id: selectedCustomer.value?.id || null,

      // Order type and status
      type: ORDER_TYPES.DELIVERY,
      status: 'HELD',
      description: 'Delivery Order',

      // Customer contact info
      contact: {
        name: selectedCustomer.value?.name || customerInfo.name.trim(),
        last_name: 'N/A',
        email: selectedCustomer.value?.email || customerInfo.email.trim(),
        phone: selectedCustomer.value?.phone || customerInfo.phone.trim(),
        second_phone: 'N/A',
        identification: 'N/A'
      },

      // Arrays
      tables_selected: [],
      packages: [],
      taxes: [],

      // Amounts and calculations
      discount: "0",
      discount_type: "fixed",
      discount_val: Math.round(Number(0)),
      discount_per_item: "NO",
      
      // SMS notification
      send_sms: sendSms.value ? 1 : 0,

      // Additional required fields
      notes: JSON.stringify({
  customerNotes: customerInfo.notes,
  timestamp: new Date().toISOString(),
  orderType: OrderType.DELIVERY,
  orderInfo: {
    customer: {
      name: customerInfo.name.trim(),
      phone: customerInfo.phone.replace(/\D/g, ''),
      email: customerInfo.email.trim(),
      address: customerInfo.address,
      unit: customerInfo.unit,
      city: customerInfo.city,
      state: customerInfo.state,
      zipCode: customerInfo.zipCode,
      notes: customerInfo.notes,
      instructions: customerInfo.notes // Keep for backward compatibility
    }
  }
}),
      hold_invoice_id: null,
      tip: "0",
      tip_type: "fixed",
      tip_val: 0
    }

    logger.debug('Creating hold order with data:', {
      ...orderData,
      debugPrices: {
        subtotal: {
          raw: cartStore.subtotal,
          cents: PriceUtils.toCents(cartStore.subtotal)
        },
        total: {
          raw: cartStore.total,
          cents: PriceUtils.toCents(cartStore.total)
        },
        tax: {
          raw: cartStore.taxAmount,
          cents: PriceUtils.toCents(cartStore.taxAmount)
        }
      }
    })

    // Get next invoice number
    const nextInvoice = await posApi.invoice.getNextNumber()
    
    if (!nextInvoice) {
      throw new Error('Failed to get next invoice number')
    }

    // Add invoice number to order data
    orderData.invoice_number = `${nextInvoice.prefix}-${nextInvoice.nextNumber}`
    
    // Create invoice directly
    const invoiceResult = await posApi.invoice.create(orderData)
    
    // Check if we have an invoice object, regardless of success flag
    if (!invoiceResult?.invoice) {
      const errorMsg = 'No invoice data received'
      logger.error('Failed to create invoice:', {
        result: invoiceResult,
        orderData: orderData
      })
      throw new Error(errorMsg)
    }

    // Add to kitchen display
    kitchenStore.addDirectInvoice(invoiceResult.invoice)

    logger.debug('Invoice created successfully:', invoiceResult.invoice)

    const convertedInvoiceData = {
      success: true,
      invoice: invoiceResult.invoice
    }
    
    if (!convertedInvoiceData.success) {
      throw new Error('Failed to prepare invoice data')
    }

    logger.debug('Converted invoice data:', convertedInvoiceData)

    // Update invoice data ref
    invoiceData.value = {
      invoice: convertedInvoiceData.invoice,
      invoicePrefix: nextInvoice.prefix,
      nextInvoiceNumber: nextInvoice.nextNumber
    }

    // Show payment dialog
    showPaymentDialog.value = true
  } catch (err) {
    logger.error('Failed to prepare delivery order:', {
      error: err,
      message: err.message,
      data: {
        customerInfo
      }
    })
    window.toastr?.error(err.message || 'Failed to prepare delivery order')
  } finally {
    processing.value = false
  }
}

const onPaymentComplete = async (success) => {
  if (success) {
    dialog.value = false
    window.toastr?.['success']('Delivery order created successfully')
  }
}

// Close modal handler
const closeModal = () => {
  if (!processing.value) {
    dialog.value = false
  }
}
</script>

<style scoped>
.modal-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: rgb(var(--v-theme-surface));
}

.v-toolbar {
  position: relative;
  z-index: 1;
}

.v-card-text {
  overflow-y: auto;
}

:deep(.v-text-field .v-field__input),
:deep(.v-select .v-field__input),
:deep(.v-textarea .v-field__input) {
  min-height: 44px;
  padding-top: 8px;
}

:deep(.v-card-actions) {
  background-color: rgb(var(--v-theme-surface));
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 12px 24px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section-title {
  margin-bottom: 16px;
  font-weight: 500;
}
</style>
