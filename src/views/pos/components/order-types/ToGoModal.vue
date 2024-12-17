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
                    @input="clearError('notes')"
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
  instructions: '',
  email: '',
  notes: ''
})

const validationErrors = reactive({
  name: '',
  phone: '',
  email: '',
  notes: ''
})

// Computed properties
const selectedStore = computed(() => companyStore.selectedStore)
const selectedCashier = computed(() => companyStore.selectedCashier)

const canProcessOrder = computed(() => {
  return !cartStore.isEmpty && 
         !!selectedStore.value && 
         !!selectedCashier.value && 
         customerInfo.name.trim() && 
         customerInfo.phone.trim()
})

// Methods
const validateForm = () => {
  let isValid = true
  clearAllErrors()

  if (!customerInfo.name.trim()) {
    validationErrors.name = 'Customer name is required'
    isValid = false
  }

  if (!customerInfo.phone.trim()) {
    validationErrors.phone = 'Phone number is required'
    isValid = false
  } else {
    const phoneDigits = customerInfo.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      validationErrors.phone = 'Please enter a valid phone number'
      isValid = false
    }
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
    holdInvoiceData.notes = JSON.stringify({
      orderType: OrderType.TO_GO,
      orderInfo: {
        customer: {
          name: customerInfo.name.trim(),
          phone: formattedPhone,
          instructions: customerInfo.instructions.trim(),
          email: customerInfo.email.trim(),
          notes: customerInfo.notes.trim()
        }
      }
    })

    console.log('ToGoModal: About to create hold order with data:', {
      type: holdInvoiceData.type,
      description: holdInvoiceData.description,
      total: holdInvoiceData.total,
      items: holdInvoiceData.hold_items?.length,
      notes: holdInvoiceData.notes
    })

    // Create hold order
    const result = await posStore.holdOrder(holdInvoiceData)
    
    console.log('ToGoModal: Hold order API response:', result)
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

    // Show payment dialog with the hold order data
    console.log('ToGoModal: Setting up payment dialog with invoice:', {
      holdInvoiceId,
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

    console.log('ToGoModal: Current invoice value set:', currentInvoice.value)

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

const handlePaymentComplete = async (result) => {
  if (result?.success) {
    // Clear the cart and reset state
    cartStore.clearCart()
    currentInvoice.value = null
    showPaymentDialog.value = false
    window.toastr?.['success']('TO-GO order processed successfully')

    // Refresh hold orders list
    await posStore.fetchHoldInvoices()
  } else {
    window.toastr?.['error']('Failed to process payment')
  }
}

const closeModal = () => {
  if (!processing.value) {
    dialog.value = false
    clearAllErrors()
    customerInfo.name = ''
    customerInfo.phone = ''
    customerInfo.instructions = ''
    customerInfo.email = ''
    customerInfo.notes = ''
  }
}

// Watch for dialog open to validate prerequisites
watch(dialog, (newValue) => {
  if (newValue && (!selectedStore.value || !selectedCashier.value)) {
    error.value = 'Please select both store and cashier first'
    dialog.value = false
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
