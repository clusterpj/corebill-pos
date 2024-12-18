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
        prepend-icon="mdi-store-clock"
        :loading="loading"
        :disabled="disabled || cartStore.isEmpty"
        class="text-none px-6"
        rounded="pill"
        :elevation="$vuetify.display.mobile ? 1 : 2"
        size="large"
        :block="$vuetify.display.mobile"
      >
        <span class="text-subtitle-1 font-weight-medium">PICK UP</span>
      </v-btn>
    </template>

    <v-card class="modal-card">
      <v-toolbar 
        color="primary"
        density="comfortable"
      >
        <v-toolbar-title class="text-h6 font-weight-medium">
          <v-icon icon="mdi-store-clock" size="large" class="mr-2"></v-icon>
          Pick Up Order
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
                  item-subtitle="subtitle"
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
                </v-autocomplete>

                <CreateCustomerDialog
                  v-model="showCreateCustomer"
                  @customer-created="onCustomerCreated"
                />
                
                <!-- Add Notes Field -->
                <v-textarea
                  v-model="customerNotes"
                  label="Order Notes"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  class="mt-4"
                  hide-details
                  placeholder="Add any special instructions or notes for this order"
                ></v-textarea>
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

            <!-- Pickup Time -->
            <v-row>
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">Pickup Time</div>
                <v-text-field
                  v-model="customerInfo.pickupTime"
                  label="Pickup Time"
                  type="time"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="validationErrors.pickupTime"
                  @input="clearError('pickupTime')"
                  required
                ></v-text-field>
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
import CreateCustomerDialog from '../customer/CreateCustomerDialog.vue'
import DeliveryPaymentDialog from '../dialogs/DeliveryPaymentDialog.vue'
import { useOrderType, ORDER_TYPES } from '../../composables/useOrderType'
import { useCustomerSearch } from '../../composables/useCustomerSearch'
import { useCartStore } from '@/stores/cart-store'
import { useCompanyStore } from '@/stores/company'
import { logger } from '../../../../utils/logger'
import { posApi } from '@/services/api/pos-api'
import { PriceUtils } from '@/utils/price'

// Initialize composables and stores
const cartStore = useCartStore()
const companyStore = useCompanyStore()
const { setOrderType, setCustomerInfo, customerNotes } = useOrderType()

// Add computed properties for store and cashier
const selectedStore = computed(() => companyStore.selectedStore)
const selectedCashier = computed(() => companyStore.selectedCashier)

// Local state
const dialog = ref(false)
const loading = ref(false)
const processing = ref(false)
const sendSms = ref(false)
const showPaymentDialog = ref(false)
const error = computed(() => searchError.value)
const customerSearch = ref('')
const selectedCustomer = ref(null)
const showCreateCustomer = ref(false)

// Customer search integration
const { 
  searchResults,
  isSearching,
  searchError,
  searchCustomers,
  createCustomer
} = useCustomerSearch()

// Customer search handlers
const onCustomerSearch = async (search) => {
  if (!search || search.length < 3) {
    searchResults.value = []
    return
  }

  try {
    isSearching.value = true
    await searchCustomers(search)
  } catch (err) {
    logger.error('Error searching customers:', err)
  }
}

const onCustomerSelect = async (selection) => {
  if (!selection) {
    clearSelectedCustomer()
    return
  }

  try {
    const customer = selection.value
    if (customer) {
      // Set the selected customer ref
      selectedCustomer.value = customer

      // First, set the basic customer info immediately
      customerInfo.name = customer.name || ''
      customerInfo.phone = customer.phone || ''
      customerInfo.email = customer.email || ''
      
      // Keep the search value
      customerSearch.value = customer.name

      // Then fetch full customer details
      const response = await posApi.get(`/v1/customers/${customer.id}`, {
        params: {
          include: 'billing_address'
        }
      })
      
      const fullCustomer = response.data.customer
      logger.debug('Full customer data:', fullCustomer)

      // Update with complete customer information
      customerInfo.name = fullCustomer?.name?.trim() || fullCustomer?.first_name?.trim() || customer.name || ''
      customerInfo.phone = fullCustomer?.phone?.trim() || customer.phone || ''
      customerInfo.email = fullCustomer?.email?.trim() || customer.email || ''

      // Update selected customer with full data
      selectedCustomer.value = fullCustomer

      logger.debug('Customer selected:', fullCustomer)
      logger.info('Customer data populated:', { 
        customer: customer.id,
        fields: { ...customerInfo }
      })

      // Clear any existing validation errors
      clearAllErrors()
    }
  } catch (err) {
    logger.error('Error selecting customer:', err)
    if (window.toastr) {
      window.toastr.error('Failed to load customer details')
    }
    // Don't clear selection on API error, keep the basic info
  }
}

const clearSelectedCustomer = () => {
  selectedCustomer.value = null
  customerInfo.name = ''
  customerInfo.phone = ''
  customerInfo.email = ''
  customerInfo.pickupTime = ''
}

const onCustomerCreated = (customer) => {
  logger.debug('[PickupModal] New customer created:', customer)
  selectedCustomer.value = {
    id: customer.id,
    title: customer.name,
    phone: customer.phone,
    email: customer.email
  }
  showCreateCustomer.value = false
  
  // Update form with new customer info
  customerInfo.name = customer.name
  customerInfo.phone = customer.phone
  customerInfo.email = customer.email
}

// Initialize notes from cart when dialog opens
watch(dialog, (isOpen) => {
  if (isOpen && cartStore.notes) {
    try {
      const notesObj = JSON.parse(cartStore.notes)
      customerNotes.value = notesObj.customerNotes || ''
    } catch (e) {
      // If parsing fails, treat as legacy format
      customerNotes.value = cartStore.notes
    }
  }
})

// Watch for changes in cart notes and sync with order type notes
watch(() => cartStore.notes, (newNotes) => {
  if (newNotes) {
    try {
      const notesObj = JSON.parse(newNotes)
      if (notesObj.customerNotes !== customerNotes.value) {
        customerNotes.value = notesObj.customerNotes || ''
      }
    } catch (e) {
      // If not JSON, treat as legacy format
      if (newNotes !== customerNotes.value) {
        customerNotes.value = newNotes
      }
    }
  } else {
    customerNotes.value = ''
  }
}, { immediate: true })

// Watch for changes in customer notes and sync with cart
watch(customerNotes, (newNotes) => {
  if (newNotes) {
    try {
      const notesObj = {
        customerNotes: newNotes,
        orderInfo: {
          customer: customerInfo
        },
        timestamp: new Date().toISOString()
      }
      cartStore.notes = JSON.stringify(notesObj)
    } catch (e) {
      logger.error('Error syncing notes with cart:', e)
    }
  } else {
    cartStore.notes = ''
  }
}, { immediate: true })

// Form state
const customerInfo = reactive({
  name: '',
  phone: '',
  email: '',
  pickupTime: ''
})

// Validation
const validationErrors = reactive({
  name: '',
  phone: '',
  pickupTime: ''
})

// Computed properties
const canProcessOrder = computed(() => {
  return !cartStore.isEmpty && 
         (customerInfo.name || '').trim() && 
         (customerInfo.phone || '').trim() && 
         (customerInfo.pickupTime || '').trim()
})

// Watch for dialog open to set order type
watch(dialog, (newValue) => {
  if (newValue) {
    setOrderType(ORDER_TYPES.PICKUP)
  } else {
    // Reset form when dialog closes
    Object.keys(customerInfo).forEach(key => {
      customerInfo[key] = ''
    })
    clearAllErrors()
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

  if (!customerInfo.pickupTime.trim()) {
    validationErrors.pickupTime = 'Pickup time is required'
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

// Process the order
const processOrder = async () => {
  if (!validateForm()) return

  processing.value = true

  try {
    // Update customer info in the order type composable
    const customerData = {
      customer_id: selectedCustomer.value?.id || null,
      name: (customerInfo.name || '').trim(),
      phone: (customerInfo.phone || '').trim(),
      email: (customerInfo.email || '').trim(),
      send_sms: sendSms.value ? 1 : 0
    }
    setCustomerInfo(customerData)

    // Get current date and due date
    const currentDate = new Date()
    const dueDate = new Date(currentDate)
    dueDate.setDate(dueDate.getDate() + 7) // Set due date to 7 days from now

    // Get next invoice number
    const nextInvoice = await posApi.invoice.getNextNumber()
    if (!nextInvoice) {
      throw new Error('Failed to get next invoice number')
    }

    // Format notes with additional context
    const formattedNotes = customerNotes.value ? JSON.stringify({
      customerNotes: customerNotes.value,
      orderInfo: {
        customer: customerInfo,
        store: selectedStore.value?.name || '',
        cashier: selectedCashier.value?.name || '',
        orderType: 'pickup'
      },
      timestamp: new Date().toISOString()
    }) : ''

    // Create invoice data with required fields
    const orderData = {
      // Required fields first
      invoice_date: currentDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      invoice_number: `${nextInvoice.prefix}-${nextInvoice.nextNumber}`,
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
      type: ORDER_TYPES.PICKUP,
      status: 'HELD',
      description: `Pick Up Order - ${customerInfo.pickupTime}`,

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

      // Notes with additional context
      notes: formattedNotes,
      
      // Additional required fields
      hold_invoice_id: null,
      tip: "0",
      tip_type: "fixed",
      tip_val: 0
    }

    logger.debug('Creating pickup order with data:', orderData)

    // Create invoice
    const invoiceResult = await posApi.invoice.create(orderData)
    
    if (!invoiceResult?.invoice) {
      throw new Error('No invoice data received')
    }

    logger.debug('Invoice created successfully:', invoiceResult)

    // Update invoice data for payment dialog
    invoiceData.value = {
      invoice: {
        ...invoiceResult.invoice,
        type: ORDER_TYPES.PICKUP  // Explicitly set the type
      },
      invoicePrefix: nextInvoice.prefix,
      nextInvoiceNumber: nextInvoice.nextNumber
    }

    // Show payment dialog
    showPaymentDialog.value = true
  } catch (error) {
    logger.error('Failed to prepare pickup order:', {
      error,
      message: error.message,
      data: { customerInfo }
    })
    if (window.toastr) {
      window.toastr.error('Failed to create pickup order. Please try again.')
    }
  } finally {
    processing.value = false
  }
}

const onPaymentComplete = async (success) => {
  if (success) {
    dialog.value = false
    window.toastr?.['success']('Pick up order created successfully')
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

:deep(.v-switch .v-selection-control) {
  min-height: 44px;
}

:deep(.v-list-item) {
  min-height: 64px;
  padding: 12px 16px;
}

:deep(.v-list-item-subtitle) {
  margin-top: 4px;
  opacity: 0.7;
}
</style>
