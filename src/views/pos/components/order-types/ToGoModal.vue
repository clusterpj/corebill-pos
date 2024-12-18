<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    transition="dialog-bottom-transition"
    :scrim="false"
  >
    <template v-slot:activator="{ props: dialogProps }">
      <v-btn
        color="primary"
        v-bind="dialogProps"
        prepend-icon="mdi-shopping"
        :loading="loading"
        :disabled="disabled || cartStore.isEmpty"
        class="text-none px-6"
        rounded="pill"
        :elevation="$vuetify.display.mobile ? 1 : 2"
        size="large"
        :block="$vuetify.display.mobile"
      >
        <span class="text-subtitle-1 font-weight-medium">TO GO</span>
      </v-btn>
    </template>

    <v-card class="modal-card">
      <v-toolbar
        color="primary"
        density="comfortable"
      >
        <v-toolbar-title class="text-h6 font-weight-medium">
          <v-icon icon="mdi-shopping" size="large" class="mr-2"></v-icon>
          To Go Order
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
          <v-fade-transition>
            <!-- Loading State -->
            <v-row v-if="loading">
              <v-col cols="12" class="text-center">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                ></v-progress-circular>
              </v-col>
            </v-row>

            <!-- Error State -->
            <v-row v-else-if="error">
              <v-col cols="12">
                <v-alert
                  type="error"
                  variant="tonal"
                  closable
                  class="mb-4"
                  @click:close="error = null"
                >
                  {{ error }}
                </v-alert>
              </v-col>
            </v-row>

            <!-- Customer Information Form -->
            <v-form
              v-else
              @submit.prevent="processOrder"
            >
              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-1 mb-2">Customer Information</div>
                  <v-text-field
                    v-model="customerInfo.name"
                    label="Customer Name"
                    variant="outlined"
                    density="comfortable"
                    :error-messages="validationErrors.name"
                    @input="clearError('name')"
                    required
                    prepend-inner-icon="mdi-account"
                    placeholder="Enter customer name"
                    class="mb-4"
                    bg-color="surface"
                  ></v-text-field>

                  <v-text-field
                    v-model="customerInfo.phone"
                    label="Phone Number"
                    variant="outlined"
                    density="comfortable"
                    :error-messages="validationErrors.phone"
                    @input="clearError('phone')"
                    required
                    prepend-inner-icon="mdi-phone"
                    placeholder="Enter phone number"
                    class="mb-4"
                    bg-color="surface"
                  ></v-text-field>

                  <v-text-field
                    v-model="customerInfo.email"
                    label="Email"
                    variant="outlined"
                    density="comfortable"
                    :error-messages="validationErrors.email"
                    @input="clearError('email')"
                    prepend-inner-icon="mdi-email"
                    placeholder="Enter email address"
                    class="mb-4"
                    bg-color="surface"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="text-subtitle-1 mb-2">Order Notes</div>
                  <v-textarea
                    v-model="customerInfo.notes"
                    label="Special Instructions"
                    variant="outlined"
                    density="comfortable"
                    :error-messages="validationErrors.notes"
                    @input="updateNotes"
                    prepend-inner-icon="mdi-note-text"
                    placeholder="Enter any special instructions"
                    rows="4"
                    auto-grow
                    bg-color="surface"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-form>
          </v-fade-transition>
        </v-container>

        <!-- Action Buttons -->
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            size="large"
            :loading="loading"
            :disabled="loading"
            @click="processOrder"
            class="px-6"
          >
            <v-icon start>mdi-cash-register</v-icon>
            Process Order
          </v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>

    <!-- Payment Dialog -->
    <PaymentDialog
      v-model="showPaymentDialog"
      :invoice="currentInvoice"
      @payment-complete="handlePaymentComplete"
    />
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useCartStore } from '../../../../stores/cart-store'
import { useCompanyStore } from '../../../../stores/company'
import { logger } from '../../../../utils/logger'
import { OrderType } from '../../../../types/order'
import { usePosStore } from '../../../../stores/pos-store'
import { useOrderType } from '../../composables/useOrderType'
import { parseOrderNotes } from '../../../../stores/cart/helpers'
import PaymentDialog from '../dialogs/PaymentDialog.vue'

// Props
defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

// Store access
const cartStore = useCartStore()
const companyStore = useCompanyStore()
const posStore = usePosStore()
const { customerNotes } = useOrderType()

// Local state
const dialog = ref(false)
const loading = ref(false)
const processing = ref(false)
const error = ref(null)
const currentInvoice = ref(null)
const showPaymentDialog = ref(false)

// Form state
const customerInfo = reactive({
  name: '',
  phone: '',
  email: '',
  notes: ''
})

const validationErrors = reactive({
  name: '',
  phone: '',
  email: '',
  notes: ''
})

// Computed
const selectedStore = computed(() => companyStore.selectedStore)
const selectedCashier = computed(() => companyStore.selectedCashier)

// Update notes in cart store
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
      orderType: OrderType.TO_GO,
      orderInfo: {
        ...existingNotes.orderInfo,
        customer: {
          ...existingNotes.orderInfo?.customer,
          name: customerInfo.name.trim(),
          phone: customerInfo.phone.replace(/\D/g, ''),
          email: customerInfo.email.trim(),
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

// Methods
const validateForm = () => {
  clearAllErrors()
  let isValid = true

  if (!customerInfo.name.trim()) {
    validationErrors.name = 'Name is required'
    isValid = false
  }

  if (!customerInfo.phone.trim()) {
    validationErrors.phone = 'Phone number is required'
    isValid = false
  }

  if (customerInfo.email && !customerInfo.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    validationErrors.email = 'Invalid email format'
    isValid = false
  }

  return isValid
}

const clearError = (field) => {
  validationErrors[field] = ''
}

const clearAllErrors = () => {
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key] = ''
  })
}

const processOrder = async () => {
  if (!validateForm()) return

  processing.value = true
  error.value = null

  try {
    // Format phone number
    const formattedPhone = customerInfo.phone.replace(/\D/g, '')

    // Get base invoice data
    const baseInvoiceData = cartStore.prepareHoldInvoiceData(
      selectedStore.value,
      selectedCashier.value,
      `TO_GO_${customerInfo.name}`
    )

    // Create hold invoice data without tip fields
    const holdInvoiceData = {
      ...baseInvoiceData,
      type: OrderType.TO_GO,
      description: `TO_GO_${customerInfo.name}`,
      cash_register_id: companyStore.selectedCashier?.id || companyStore.company?.id || 1,
      hold_items: cartStore.items.map(item => ({
        item_id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        quantity: item.quantity,
        unit_name: item.unit_name || 'units',
        tax: item.tax || 0
      }))
    }

    // Remove tip-related fields that aren't supported for hold invoices
    delete holdInvoiceData.tip
    delete holdInvoiceData.tip_type
    delete holdInvoiceData.tip_val

    // Validate items exist
    if (!holdInvoiceData.hold_items?.length) {
      throw new Error('No items found in cart')
    }

    // Ensure the notes are properly formatted for the invoice
    const notesObj = {
      customerNotes: customerInfo.notes,
      timestamp: new Date().toISOString(),
      orderType: OrderType.TO_GO,
      orderInfo: {
        customer: {
          name: customerInfo.name.trim(),
          phone: formattedPhone,
          email: customerInfo.email.trim(),
          notes: customerInfo.notes,
          instructions: customerInfo.notes // Keep for backward compatibility
        }
      }
    }

    holdInvoiceData.notes = JSON.stringify(notesObj)

    logger.debug('Processing TO-GO order with data:', {
      type: holdInvoiceData.type,
      description: holdInvoiceData.description,
      total: holdInvoiceData.total,
      items: holdInvoiceData.hold_items?.length,
      notes: holdInvoiceData.notes
    })

    // Create hold order
    const result = await posStore.holdOrder(holdInvoiceData)
    
    logger.debug('Hold order response:', result)

    if (!result?.success) {
      throw new Error(result?.message || 'Failed to create hold order')
    }

    // Fetch the latest hold invoices to get our new one
    await posStore.fetchHoldInvoices()
    
    // Find our newly created hold invoice
    const holdInvoice = posStore.holdInvoices.find(inv => 
      inv.description === holdInvoiceData.description &&
      inv.type === OrderType.TO_GO
    )

    if (!holdInvoice) {
      logger.error('Could not find newly created hold invoice')
      throw new Error('Failed to retrieve created hold invoice')
    }

    // Validate essential fields
    if (!holdInvoice.total || !holdInvoice.hold_items?.length) {
      logger.error('Missing required hold invoice fields:', holdInvoice)
      throw new Error('Invalid hold invoice data: missing total or items')
    }

    // Store the hold invoice ID
    const holdInvoiceId = holdInvoice.id
    cartStore.setHoldInvoiceId(holdInvoiceId)

    logger.info('TO-GO hold order created successfully:', {
      holdInvoiceId: holdInvoiceId,
      description: holdInvoice.description,
      total: holdInvoice.total,
      items: holdInvoice.hold_items?.length
    })

    currentInvoice.value = {
      invoice: holdInvoice,
      invoicePrefix: 'TO-GO',
      nextInvoiceNumber: holdInvoiceId,
      description: holdInvoice.description
    }

    // Double check the invoice data is valid
    if (!currentInvoice.value.invoice?.total) {
      logger.error('Invalid invoice data for payment:', currentInvoice.value)
      throw new Error('Invalid invoice data for payment')
    }
    showPaymentDialog.value = true
    dialog.value = false
  } catch (err) {
    error.value = err.message || 'Failed to process order'
    logger.error('Failed to process TO-GO order:', err)
  } finally {
    processing.value = false
  }
}

const handlePaymentComplete = (result) => {
  logger.info('Payment completed:', result)
  showPaymentDialog.value = false
  dialog.value = false
  // Clear form
  Object.keys(customerInfo).forEach(key => {
    customerInfo[key] = ''
  })
}

const closeModal = () => {
  dialog.value = false
  error.value = null
  // Clear form
  Object.keys(customerInfo).forEach(key => {
    customerInfo[key] = ''
  })
}

// Watch for dialog open to validate prerequisites and initialize notes
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

// Watch for changes in customer notes from useOrderType
watch(() => customerNotes.value, (newNotes) => {
  if (newNotes !== customerInfo.notes) {
    customerInfo.notes = newNotes
    logger.debug('Updated notes from customer notes:', { newNotes })
  }
})
</script>

<style scoped>
.modal-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.v-card-text {
  flex: 1;
  overflow-y: auto;
}

.v-form {
  max-width: 1200px;
  margin: 0 auto;
}

:deep(.v-field) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.v-field:not(.v-field--disabled):hover) {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

:deep(.v-text-field .v-input__details) {
  padding-inline-start: 16px;
}
</style>
