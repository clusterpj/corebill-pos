<!-- src/views/pos/components/dialogs/PaymentDialog.vue -->
<template>
  <div class="payment-dialog-wrapper">
    <v-dialog 
      v-model="dialog" 
      fullscreen
      transition="dialog-bottom-transition"
      :scrim="false"
      class="payment-dialog"
    >
      <v-card class="modal-card">
        <v-toolbar 
          color="primary"
          :elevation="1"
          class="payment-toolbar"
        >
          <v-toolbar-title class="text-h6 font-weight-medium text-on-primary">
            <v-icon icon="mdi-cash-register" size="large" class="mr-2" color="on-primary"></v-icon>
            Process Payment
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon
            @click="closeDialog"
            color="on-primary"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <div class="payment-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <div class="text-h6 mt-4">Loading Payment Methods...</div>
          </div>

          <template v-else>
            <v-container class="payment-container">
              <v-row>
                <v-col cols="12" md="4">
                  <!-- Invoice Summary Card -->
                  <v-card
                    variant="elevated"
                    class="invoice-summary-card mb-4"
                    elevation="2"
                  >
                    <v-card-item>
                      <template v-slot:prepend>
                        <v-icon
                          icon="mdi-receipt"
                          size="large"
                          color="primary"
                          class="mr-4"
                        ></v-icon>
                      </template>
                      <v-card-title class="text-h6 pb-2">
                        Invoice Summary
                      </v-card-title>
                    </v-card-item>
                    <v-divider></v-divider>
                    <v-card-text class="py-4">
                      <div class="d-flex justify-space-between mb-2">
                        <span>Invoice Number:</span>
                        <strong>{{ invoiceNumber }}</strong>
                      </div>
                      <div class="d-flex justify-space-between mb-2">
                        <span>Subtotal:</span>
                        <strong>{{ formatCurrency(invoiceTotal) }}</strong>
                      </div>
                      <div class="d-flex justify-space-between mb-2" v-if="tipAmount > 0">
                        <span>Tip:</span>
                        <strong>{{ formatCurrency(tipAmount) }}</strong>
                      </div>
                      <div class="d-flex justify-space-between mb-2">
                        <span>Total Amount:</span>
                        <strong>{{ formatCurrency(invoiceTotal + tipAmount) }}</strong>
                      </div>
                    </v-card-text>
                  </v-card>

                  <!-- Tip Button -->
                  <v-btn
                    block
                    color="primary"
                    variant="outlined"
                    @click="showTipDialog = true"
                    class="mb-4 tip-button"
                    height="48"
                  >
                    {{ tipAmount > 0 ? `Update Tip (${formatCurrency(tipAmount)})` : 'Add Tip' }}
                  </v-btn>
                </v-col>

                <v-col cols="12" md="8">
                  <!-- Payment Methods Selection -->
                  <div class="text-subtitle-1 mb-3 font-weight-medium">Select Payment Method</div>
                  <template v-if="paymentMethods.length > 0">
                    <v-row class="payment-methods-grid">
                      <v-col v-for="method in paymentMethods" 
                             :key="method.id" 
                             cols="6" 
                             sm="4">
                        <v-btn
                          block
                          :color="isMethodSelected(method.id) ? 'primary' : undefined"
                          :variant="isMethodSelected(method.id) ? 'flat' : 'outlined'"
                          class="payment-method-btn"
                          height="64"
                          @click="selectPaymentMethod(method.id)"
                          :disabled="isMethodDisabled(method.id)"
                        >
                          <v-icon :icon="getPaymentMethodIcon(method.name)" class="mr-2"></v-icon>
                          {{ method.name }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </template>
                  <template v-else>
                    <v-alert
                      type="warning"
                      variant="tonal"
                      class="mb-4"
                    >
                      No payment methods available. Please configure payment methods in settings.
                    </v-alert>
                  </template>

                  <!-- Active Payment Methods -->
                  <div v-if="payments.length > 0" class="active-payments-section">
                    <div v-for="(payment, index) in payments" :key="index" class="payment-section">
                      <v-card variant="outlined" class="pa-4">
                        <div class="d-flex align-center mb-4">
                          <v-icon :icon="getPaymentMethodIcon(getPaymentMethod(payment.method_id)?.name)" class="mr-2"></v-icon>
                          <span class="text-h6">{{ getPaymentMethod(payment.method_id)?.name }}</span>
                          <v-spacer></v-spacer>
                          <v-btn
                            icon="mdi-close"
                            variant="text"
                            density="comfortable"
                            @click="removePayment(index)"
                          ></v-btn>
                        </div>

                        <!-- Amount Display -->
                        <div class="amount-display">
                          <div class="amount-display__label">Amount</div>
                          <div class="amount-display__value-container"
                               :class="{ 'is-error': !isValidAmount(payment) }">
                            <div class="amount-display__amount">
                              <span class="amount-display__currency">$</span>{{ PriceUtils.toDollars(payment.amount).toFixed(2) }}
                            </div>
                          </div>
                          <transition name="fade">
                            <div v-if="!isValidAmount(payment)" class="amount-display__error">
                              <v-icon icon="mdi-alert-circle" size="small" color="error" class="mr-1" />
                              Full payment amount is required
                            </div>
                          </transition>
                        </div>

                        <!-- Cash Payment Fields -->
                        <template v-if="isCashOnly(payment.method_id)">
                          <!-- Denominations Grid -->
                          <div v-if="getDenominations(payment.method_id)?.length" class="mb-4">
                            <div class="text-subtitle-2 mb-2">Quick Amount Selection</div>
                            <v-row>
                              <v-col v-for="money in getDenominations(payment.method_id)" 
                                    :key="money.id" 
                                    cols="4" 
                                    class="pa-1">
                                <v-btn block
                                      variant="outlined"
                                      class="denomination-btn"
                                      size="small"
                                      @click="handleDenominationClick(money, index)">
                                  {{ formatCurrency(PriceUtils.toCents(money.amount)) }}
                                </v-btn>
                              </v-col>
                            </v-row>
                          </div>

                          <!-- Received Amount -->
                          <div class="amount-display">
                            <div class="amount-display__label">Amount Received</div>
                            <div class="amount-display__value-container"
                                 :class="{ 'is-error': !isValidReceivedAmount(payment) }">
                              <div class="amount-display__amount">
                                <span class="amount-display__currency">$</span>
                                <input
                                  v-model="payment.displayReceived"
                                  type="number"
                                  class="amount-display__input"
                                  step="0.01"
                                  min="0"
                                  @input="calculateChange(index)"
                                />
                              </div>
                            </div>
                            <transition name="fade">
                              <div v-if="!isValidReceivedAmount(payment)" class="amount-display__error">
                                <v-icon icon="mdi-alert-circle" size="small" color="error" class="mr-1" />
                                Received amount must be greater than or equal to payment amount
                              </div>
                            </transition>
                          </div>
                        </template>

                        <!-- Payment Fees -->
                        <div v-if="hasPaymentFees(payment.method_id)" class="text-caption mb-2">
                          <div class="d-flex justify-space-between">
                            <span>Service Fee:</span>
                            <strong>{{ formatCurrency(payment.fees) }}</strong>
                          </div>
                          <div class="text-grey">
                            {{ getFeeDescription(payment.method_id, payment.amount) }}
                          </div>
                        </div>

                        <!-- Payment Amount Display -->
                        <div class="d-flex justify-space-between mb-2">
                          <span>Payment Amount:</span>
                          <strong>${{ PriceUtils.toDollars(payment.amount).toFixed(2) }}</strong>
                        </div>
                        <div v-if="payment.displayReceived" class="d-flex justify-space-between mb-2">
                          <span>Amount Received:</span>
                          <strong>${{ Number(payment.displayReceived).toFixed(2) }}</strong>
                        </div>
                        <div v-if="payment.returned > 0" class="d-flex justify-space-between mb-2">
                          <span>Change:</span>
                          <strong>${{ PriceUtils.toDollars(payment.returned).toFixed(2) }}</strong>
                        </div>
                        <div v-if="payment.fees" class="d-flex justify-space-between">
                          <span>Fees:</span>
                          <strong>{{ formatCurrency(payment.fees) }}</strong>
                        </div>

                        <v-divider v-if="index < payments.length - 1" class="my-4"></v-divider>
                      </v-card>
                    </div>

                    <!-- Add Payment Method Button -->
                    <v-btn
                      v-if="canAddMorePayments"
                      block
                      color="primary"
                      variant="outlined"
                      @click="addPayment"
                      class="mt-4"
                      height="48"
                    >
                      <v-icon start>mdi-plus</v-icon>
                      Add Another Payment Method
                    </v-btn>
                  </div>
                </v-col>
              </v-row>

              <!-- Error Message -->
              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                closable
                class="error-alert"
                @click:close="error = null"
              >
                {{ error }}
              </v-alert>

              <!-- Process Payment Button -->
              <div class="process-payment-footer">
                <v-btn
                  color="primary"
                  size="large"
                  block
                  height="56"
                  @click="processPayment"
                  :loading="processing"
                  :disabled="!isValid || processing"
                  class="process-payment-btn"
                >
                  <v-icon start>mdi-cash-register</v-icon>
                  Process Payment
                </v-btn>
              </div>
            </v-container>
          </template>
        </div>
      </v-card>
    </v-dialog>

    <!-- Tip Dialog -->
    <v-dialog v-model="showTipDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">
          Select Tip Amount
        </v-card-title>
        <v-card-text>
          <p class="text-subtitle-2 mb-4">Choose a tip percentage or enter a custom amount.</p>
          
          <!-- Preset Tip Percentages -->
          <v-row class="mb-4">
            <v-col v-for="percent in tipPercentages" :key="percent" cols="3">
              <v-btn
                block
                :variant="selectedTipPercent === percent ? 'flat' : 'outlined'"
                :color="selectedTipPercent === percent ? 'primary' : undefined"
                @click="selectTipPercent(percent)"
              >
                {{ percent }}%
              </v-btn>
            </v-col>
          </v-row>

          <!-- Custom Tip Input -->
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="customTipPercent"
                label="Custom %"
                type="number"
                min="0"
                max="100"
                append-inner-text="%"
                @input="handleCustomTipInput"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Tip Amount Display -->
          <v-row v-if="calculatedTip > 0">
            <v-col cols="12">
              <div class="d-flex justify-space-between">
                <span>Tip Amount:</span>
                <strong>{{ formatCurrency(calculatedTip) }}</strong>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="cancelTip">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="confirmTip">
            Confirm Tip
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add PDF Viewer Dialog -->
    <PdfViewerDialog
      v-model="showPdfViewer"
      :pdf-url="currentPdfUrl"
      title="Invoice"
      @closed="handlePdfViewerClosed"
    />

    <!-- Error Details Dialog -->
    <v-dialog v-model="showErrorDetails" max-width="600px">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          Payment Declined
        </v-card-title>
        <v-card-text>
          <div class="text-body-1 mb-4">{{ userFriendlyError }}</div>
          
          <v-expansion-panels variant="accordion">
            <v-expansion-panel title="Technical Details">
              <v-expansion-panel-text>
                <div class="text-caption">
                  <div v-if="lastError.declineCode">
                    <strong>Error Code:</strong> {{ lastError.declineCode }}
                  </div>
                  <div><strong>Message:</strong> {{ lastError.message }}</div>
                  <div v-if="lastError.response">
                    <strong>Full Response:</strong> 
                    <pre class="mt-2">{{ JSON.stringify(lastError.response, null, 2) }}</pre>
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showErrorDetails = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePayment } from '../../composables/usePayment'

// Error mapping for payment failures
const errorMap = {
  // Terminal decline codes
  'BLOCKED 1ST USE': 'Card requires activation - first use must be at bank ATM',
  '05': 'Insufficient funds - please try another payment method',
  '1015': 'Payment method restricted',
  'CARD_ACTIVATION_REQUIRED': 'Card requires activation - first use must be at bank ATM',
  'TIMEOUT': 'Terminal response timeout - check connection',
  
  // Gateway errors
  'DECLINED': 'Payment declined by issuer',
  'TERMINAL_NOT_FOUND': 'Payment terminal unavailable',
  'SPIN_ERROR': 'Payment processor error',
  'UNKNOWN': 'Payment processing failed',
  
  // Fallbacks
  'TERMINAL_DECLINED: Payment declined': 'Payment declined - contact card issuer',
  'TERMINAL_DECLINED: BLOCKED 1ST USE': 'Card requires activation - first use must be at bank ATM'
}

// Safe analytics wrapper
const analytics = {
  track: (eventName, properties = {}) => {
    if (window.analytics) {
      window.analytics.track(eventName, properties)
    } else {
      console.log(`[Analytics] ${eventName}:`, properties)
    }
  }
}

// Cache for formatted currency values to improve performance
const currencyCache = new Map()
import { useTableManagement } from '../../composables/useTableManagement'
import { convertHeldOrderToInvoice } from '../held-orders/utils/invoiceConverter'
import { posApi } from '@/services/api/pos-api'
import { PriceUtils } from '@/utils/price'
import PdfViewerDialog from '@/components/common/PdfViewerDialog.vue'
import { paymentOperations } from '@/services/api/pos-operations/payment'

const emit = defineEmits(['update:modelValue', 'paymentComplete'])

const props = defineProps({
  modelValue: Boolean,
  invoice: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

// Get invoice total in cents from the invoice object
const invoiceTotal = computed(() => {
  const total = props.invoice?.invoice?.total || 0
  console.log('PaymentDialog - Raw invoice total:', {
    rawTotal: total,
    invoice: props.invoice?.invoice,
    isDollarAmount: PriceUtils.isInDollars(total),
    isCentsAmount: total > 100
  })
  return total // Already in cents
})

const payment = usePayment()
const {
  loading: paymentLoading,
  error: paymentError,
  paymentMethods,
  settings,
  createPayment,
  fetchPaymentMethods,
  fetchSettings,
  getDenominations,
  calculateFees,
  getPaymentMethod,
  isCashOnly
} = payment

// Debug payment methods
watch(paymentMethods, (newMethods) => {
  console.log('Payment methods updated:', newMethods)
}, { immediate: true })

watch(paymentLoading, (loading) => {
  console.log('Payment loading state:', loading)
})

watch(paymentError, (error) => {
  if (error) {
    console.error('Payment error:', error)
  }
})

const {
  loading: tableLoading,
  error: tableError,
  releaseTablesAfterPayment
} = useTableManagement()

const loading = computed(() => paymentLoading.value || tableLoading.value)
const error = computed(() => paymentError.value || tableError.value)

const processing = ref(false)
const payments = ref([])
const showPdfViewer = ref(false)
const currentPdfUrl = ref('')
const showErrorDetails = ref(false)
const lastError = ref(null)
const userFriendlyError = ref('')

// PDF viewer handlers
const handlePdfViewerClosed = () => {
  currentPdfUrl.value = ''
}

// Tip related state
const showTipDialog = ref(false)
const tipPercentages = [15, 18, 20, 25]
const selectedTipPercent = ref(null)
const customTipPercent = ref('')
const tipAmount = ref(0)
const tipType = ref('percentage')

// Computed properties for invoice details
const invoiceNumber = computed(() => {
  return props.invoice?.invoice?.invoice_number || 
         `${props.invoice?.invoicePrefix}-${props.invoice?.nextInvoiceNumber}` || 
         ''
})

const calculatedTip = computed(() => {
  const percent = selectedTipPercent.value || Number(customTipPercent.value) || 0
  const dollarAmount = PriceUtils.toDollars(invoiceTotal.value)
  const tipAmount = Math.round((dollarAmount * (percent / 100)) * 100)
  console.log('PaymentDialog - Tip calculation:', {
    percent,
    invoiceTotalInCents: invoiceTotal.value,
    invoiceTotalInDollars: dollarAmount,
    calculatedTipInCents: tipAmount
  })
  return tipAmount
})

// Dialog computed property
const dialog = computed({
  get: () => {
    console.log('🪟 PaymentDialog - Getting dialog value:', props.modelValue)
    return props.modelValue
  },
  set: (value) => {
    console.log('🪟 PaymentDialog - Setting dialog value:', value)
    console.log('🪟 PaymentDialog - Current DOM state:', {
      dialogElement: document.querySelector('.payment-dialog'),
      dialogVisible: document.querySelector('.payment-dialog')?.style.display,
      vDialogElement: document.querySelector('.v-dialog'),
      vDialogVisible: document.querySelector('.v-dialog')?.style.display
    })
    
    // Add haptic feedback
    if (value && window.navigator?.vibrate) {
      window.navigator.vibrate(50)
    }
    
    // Track visibility changes
    analytics.track(value ? 'PaymentDialogOpened' : 'PaymentDialogClosed')
    
    emit('update:modelValue', value)
  }
})

const remainingAmount = computed(() => {
  const totalPaid = payments.value.reduce((sum, payment) => {
    return sum + payment.amount // amounts are in cents
  }, 0)
  const remaining = invoiceTotal.value + tipAmount.value - totalPaid
  console.log('PaymentDialog - Remaining amount:', {
    invoiceTotalInCents: invoiceTotal.value,
    tipAmountInCents: tipAmount.value,
    totalPaidInCents: totalPaid,
    remainingInCents: remaining
  })
  return remaining
})

const totalPayments = computed(() => {
  return payments.value.reduce((sum, payment) => {
    return sum + payment.amount // amounts are in cents
  }, 0)
})

const totalFees = computed(() => {
  return payments.value.reduce((sum, payment) => {
    return sum + (payment.fees || 0)
  }, 0)
})

const canAddMorePayments = computed(() => {
  return remainingAmount.value > 0 && payments.value.length < paymentMethods.value.length
})

const isValidAmount = (payment) => {
  if (!payment.displayAmount) return false
  if (Number(payment.displayAmount) <= 0) return false
  return Number(payment.displayAmount) === PriceUtils.toDollars(invoiceTotal.value + tipAmount.value)
}

const isValidReceivedAmount = (payment) => {
  if (!payment.displayReceived) return false
  return Number(payment.displayReceived) >= Number(payment.displayAmount)
}

const isValid = computed(() => {
  return payments.value.every(payment => {
    if (!payment.method_id || !payment.amount) return false
    if (isCashOnly(payment.method_id) && !payment.received) return false
    if (!isValidAmount(payment)) return false
    if (isCashOnly(payment.method_id) && !isValidReceivedAmount(payment)) return false
    return true
  }) && remainingAmount.value === 0
})

// Methods
const formatCurrency = (amount) => {
  // Cache formatted values for better performance
  const cached = currencyCache.get(amount)
  if (cached) {
    return cached
  }

  console.log('PaymentDialog - Formatting currency:', {
    inputAmount: amount,
    isDollarAmount: PriceUtils.isInDollars(amount),
    isCentsAmount: amount > 100,
    formattedResult: PriceUtils.format(amount)
  })
  
  const formatted = PriceUtils.format(amount)
  currencyCache.set(amount, formatted)
  return formatted
}

const hasPaymentFees = (methodId) => {
  const method = getPaymentMethod(methodId)
  return method?.IsPaymentFeeActive === 'YES'
}

const getFeeDescription = (methodId, amount) => {
  const method = getPaymentMethod(methodId)
  if (!method?.registrationdatafees) return ''

  const fees = method.registrationdatafees
  switch (fees.type) {
    case 'FIXED':
      return `Fixed fee: ${formatCurrency(fees.value)}`
    case 'PERCENTAGE':
      return `${fees.value}% of transaction amount`
    case 'FIXED_PLUS_PERCENTAGE':
      return `${formatCurrency(fees.value.fixed)} + ${fees.value.percentage}% of transaction amount`
    default:
      return ''
  }
}

const getPaymentMethodIcon = (methodName) => {
  const icons = {
    'Cash': 'mdi-cash',
    'Credit Card': 'mdi-credit-card',
    'Debit Card': 'mdi-credit-card-outline',
    'Check': 'mdi-checkbox-marked-circle-outline',
    'Gift Card': 'mdi-gift',
    'Mobile Payment': 'mdi-cellphone',
    'Bank Transfer': 'mdi-bank',
  }
  return icons[methodName] || 'mdi-currency-usd'
}

const isMethodSelected = (methodId) => {
  return payments.value.some(payment => payment.method_id === methodId)
}

const isMethodDisabled = (methodId) => {
  return isMethodSelected(methodId) || payments.value.length >= paymentMethods.value.length
}

const selectPaymentMethod = (methodId) => {
  if (isMethodSelected(methodId) || isMethodDisabled(methodId)) return
  
  // Add new payment with remaining amount
  const remaining = remainingAmount.value
  const displayAmount = PriceUtils.toDollars(remaining).toString()
  
  payments.value.push({
    method_id: methodId,
    amount: remaining,
    displayAmount,
    received: remaining,
    displayReceived: displayAmount,
    returned: 0,
    fees: 0
  })
  
  validateAmount(payments.value.length - 1)
}

const handleDenominationClick = (money, index) => {
  const payment = payments.value[index]
  const selectedAmount = Number(money.amount)
  
  // Replace current amount with selected amount (in dollars)
  payment.displayReceived = selectedAmount.toFixed(2)
  // Update internal amount (in cents)
  payment.received = PriceUtils.toCents(payment.displayReceived)
  
  calculateChange(index)
  
  // Provide haptic feedback if available
  if (window.navigator?.vibrate) {
    window.navigator.vibrate(50)
  }
}

const calculateChange = (index) => {
  const payment = payments.value[index]
  if (!payment.displayReceived || !payment.displayAmount) return

  // Convert display amounts to cents for calculations
  const receivedInCents = PriceUtils.toCents(payment.displayReceived)
  const amountInCents = payment.amount // Already in cents
  
  // Update internal values
  payment.received = receivedInCents
  
  // Calculate change in cents
  if (receivedInCents >= amountInCents) {
    payment.returned = receivedInCents - amountInCents
  } else {
    payment.returned = 0
  }
}

const validateAmount = (index) => {
  const payment = payments.value[index]
  if (!payment) return

  // Set display amount based on remaining total
  const total = invoiceTotal.value + tipAmount.value
  console.log('PaymentDialog - Validating payment amount:', {
    paymentIndex: index,
    totalInCents: total,
    totalInDollars: PriceUtils.toDollars(total),
    currentPayment: { ...payment }
  })

  payment.displayAmount = PriceUtils.toDollars(total).toString()
  payment.amount = total

  // Calculate fees if applicable
  if (hasPaymentFees(payment.method_id)) {
    payment.fees = calculateFees(payment.method_id, payment.amount)
  }

  const method = paymentMethods.value.find(m => m.id === payment.method_id)
  if (method?.only_cash === 1) {
    // Handle cash payments - received amount is in dollars, convert to cents
    const receivedInCents = PriceUtils.toCents(payment.displayReceived)
    console.log('PaymentDialog - Cash payment received:', {
      displayReceived: payment.displayReceived,
      receivedInCents,
      paymentAmount: payment.amount
    })
    payment.received = receivedInCents
    payment.returned = Math.max(0, payment.received - payment.amount)
  } else {
    payment.displayReceived = payment.displayAmount
    payment.received = payment.amount
    payment.returned = 0
  }
}

const addPayment = () => {
  payments.value.push({ 
    method_id: null, 
    amount: 0,
    displayAmount: PriceUtils.toDollars(invoiceTotal.value + tipAmount.value).toString(), // Include tip
    received: 0,
    displayReceived: '0',
    returned: 0,
    fees: 0 
  })
}

const removePayment = (index) => {
  payments.value.splice(index, 1)
  // Recalculate amounts for remaining payments
  payments.value.forEach((payment, idx) => validateAmount(idx))
}

const closeDialog = () => {
  if (!processing.value) {
    dialog.value = false
  }
}

// Tip related methods
const selectTipPercent = (percent) => {
  selectedTipPercent.value = percent
  customTipPercent.value = ''
}

const handleCustomTipInput = () => {
  selectedTipPercent.value = null
}

const cancelTip = () => {
  showTipDialog.value = false
  selectedTipPercent.value = null
  customTipPercent.value = ''
}

const confirmTip = () => {
  tipAmount.value = calculatedTip.value
  tipType.value = 'percentage'
  showTipDialog.value = false
  
  // Update payment amounts after tip change
  payments.value.forEach((payment, index) => validateAmount(index))
}

const processPayment = async () => {
  if (!isValid.value || processing.value) {
    return
  }

  processing.value = true
  try {
    // Validate terminal payments
    const terminalPayments = payments.value.filter(p => {
      const method = getPaymentMethod(p.method_id)
      return method.add_payment_gateway === 1 && method.account_accepted === 'T'
    })

    for (const payment of terminalPayments) {
      const method = getPaymentMethod(payment.method_id)
      if (!method.settings_id) {
        throw new Error(`Terminal settings not configured for ${method.name}`)
      }

      // Verify terminal status using the imported paymentOperations
      const settingsResponse = await paymentOperations.getDefaultTerminalSetting(method.settings_id)
      if (!settingsResponse.success || !settingsResponse.data?.data) {
        throw new Error('Failed to get terminal settings')
      }

      // Access the nested data property
      const terminalSettings = settingsResponse.data.data

      // Debug logging with correct data access
      console.log('Terminal settings response:', {
        settingsResponse,
        terminalSettings,
        status: terminalSettings.status,
        terminal_status: terminalSettings.terminal_status,
        enabled: terminalSettings.enabled
      })

      // Check terminal status - handle both numeric and string status values
      const terminalStatus = terminalSettings.status || terminalSettings.terminal_status
      if (terminalStatus !== 1 && terminalStatus !== 'Online') {
        throw new Error(`Terminal ${method.name} is not ready for payments. Current status: ${terminalStatus}`)
      }
    }

    // Use the prepared invoice data
    const holdInvoice = props.invoice.invoice
    if (!holdInvoice) {
      console.error('No invoice data provided', {
        propsInvoice: props.invoice,
        holdInvoice
      })
      throw new Error('Invoice data not provided')
    }

    // Ensure we have the required invoice fields
    if (!holdInvoice.id || !holdInvoice.total) {
      console.error('Invalid invoice data', {
        id: holdInvoice.id,
        total: holdInvoice.total,
        invoice: holdInvoice
      })
      throw new Error('Invalid invoice data')
    }
    
    // Calculate the total with tip (convert from dollars to cents for API)
    const totalWithTip = invoiceTotal.value + tipAmount.value
    const totalChange = payments.value.reduce((sum, p) => sum + p.returned, 0)

    console.log(' [Payment] Prepared hold invoice data:', {
      id: holdInvoice.id,
      total: totalWithTip,
      originalTotal: holdInvoice.total,
      tipAmount: tipAmount.value
    })

    // Format tip data according to API requirements
    const tipPercentage = selectedTipPercent.value || Number(customTipPercent.value) || 0
    holdInvoice.tip = String(Math.round(tipPercentage)) // Ensure clean integer string
    holdInvoice.tip_type = "percentage"
    holdInvoice.tip_val = tipAmount.value // Convert dollars to cents for API
    holdInvoice.total = totalWithTip // Already in cents
    holdInvoice.due_amount = totalWithTip // Already in cents
    holdInvoice.sub_total = invoiceTotal.value // Already in cents
    
    // Log tip values for debugging
    console.log('Tip values:', {
      percentage: holdInvoice.tip,
      type: holdInvoice.tip_type,
      amount: holdInvoice.tip_val,
      total: holdInvoice.total
    })
    
    // Ensure other required fields are present
    holdInvoice.is_hold_invoice = false
    holdInvoice.is_invoice_pos = 1
    holdInvoice.is_pdf_pos = true
    holdInvoice.package_bool = false
    holdInvoice.print_pdf = false
    holdInvoice.save_as_draft = false
    holdInvoice.send_email = false
    holdInvoice.not_charge_automatically = false
    holdInvoice.avalara_bool = false
    holdInvoice.banType = true

    // Set dates
    const currentDate = new Date()
    holdInvoice.invoice_date = currentDate.toISOString().split('T')[0]
    const dueDate = new Date(currentDate)
    dueDate.setDate(dueDate.getDate() + 7) // Default to 7 days
    holdInvoice.due_date = dueDate.toISOString().split('T')[0]

    // Create invoice with tip included
    console.log(' [Payment] Converting held order to invoice...')
    const invoiceResult = await convertHeldOrderToInvoice(holdInvoice)
    console.log(' [Payment] Invoice creation result:', invoiceResult)
    
    if (!invoiceResult.success) {
      console.error(' [Payment] Failed to create invoice:', invoiceResult)
      throw new Error('Failed to create invoice')
    }

    console.log('Created invoice:', invoiceResult)

    // Add to held orders if in create-invoice-only mode
    if (props.createInvoiceOnly) {
      try {
        const heldOrderData = {
          ...invoiceResult.invoice,
          is_hold_invoice: true,
          status: 'HELD',
          description: invoiceResult.invoice.description || 'Delivery Order'
        }
        
        // Add to held orders through the API
        const holdResult = await posApi.holdInvoice.create(heldOrderData)
        
        if (!holdResult.success) {
          throw new Error('Failed to add invoice to held orders')
        }

        window.toastr?.['success']('Invoice created and added to held orders')
        emit('payment-complete', true)
        dialog.value = false
        return
      } catch (err) {
        console.error('Failed to add to held orders:', err)
        throw new Error('Failed to add invoice to held orders')
      }
    }

    // Format payments for API - amounts are already in cents
    const formattedPayments = payments.value.map(payment => ({
      method_id: payment.method_id,
      amount: payment.amount, // Already in cents
      received: payment.received, // Already in cents
      returned: payment.returned, // Already in cents
      fees: payment.fees || 0
    }))
    console.log(' [Payment] Formatted payments:', formattedPayments)

    // Validate total payment amount matches invoice total (in cents)
    const totalPaymentAmount = formattedPayments.reduce((sum, payment) => sum + payment.amount, 0)
    if (totalPaymentAmount !== totalWithTip) {
      throw new Error('Payment amount must match invoice total including tip')
    }

    // Create payment using the created invoice
    console.log(' [Payment] Creating payment...')
    const result = await createPayment(invoiceResult.invoice, formattedPayments)
    console.log(' [Payment] Payment creation result:', result)
    
    // Show invoice PDF in modal
    const invoiceId = result?.terminalResults?.[0]?.data?.payment_id || 
                     result?.regularResults?.[0]?.payment?.invoice_id || 
                     result?.invoice_id || 
                     invoiceResult?.invoice?.id || 
                     invoiceResult?.id || 
                     props.invoice?.id;
    
    if (invoiceId) {
      console.log('📄 [Invoice PDF] Starting PDF preparation', {
        paymentResult: result,
        invoiceResult: invoiceResult,
        invoiceId,
        propsInvoice: props.invoice,
        regularResults: result?.regularResults
      });

      // Get invoice details from multiple possible locations
      const invoice = result?.invoice?.invoice || 
                     result?.invoice || 
                     result?.regularResults?.[0]?.payment?.invoice || 
                     invoiceResult?.invoice || 
                     result || 
                     props.invoice;

      // Get hash from nested invoice or directly
      const invoiceHash = invoice?.unique_hash || 
                         invoice?.invoice?.unique_hash || 
                         result?.invoice?.unique_hash

      console.log('📄 [Invoice PDF] Invoice data sources:', {
        resultInvoice: result?.invoice,
        paymentInvoice: result?.regularResults?.[0]?.payment?.invoice,
        invoiceResult: invoiceResult?.invoice,
        result,
        propsInvoice: props.invoice
      });
      
      if (!invoiceHash) {
        console.error('📄 [Invoice PDF] Missing invoice hash:', {
          result,
          invoice,
          invoiceResult,
          propsInvoice: props.invoice,
          regularResults: result?.regularResults,
          nestedInvoice: result?.invoice?.invoice
        });
        window.toastr?.['error']('Could not generate invoice PDF: Missing hash');
        return;
      }

      // Validate hash format - allow alphanumeric with dots and dashes
      if (!/^[a-zA-Z0-9.-]+$/.test(invoiceHash)) {
        console.error('📄 [Invoice PDF] Invalid hash format:', invoiceHash);
        window.toastr?.['error']('Invalid invoice hash format');
        return;
      }

      // Construct PDF URL with hash validation
      const baseUrl = import.meta.env.VITE_API_URL.replace('/api/v1', '');
      const invoicePdfUrl = `${baseUrl}/invoices/pdf/${invoiceHash}`;

      console.log('📄 [Invoice PDF] Using invoice details:', {
        invoiceId: invoice.id,
        invoiceHash: invoice.unique_hash,
        baseUrl,
        constructedUrl: invoicePdfUrl,
        fullInvoice: invoice
      });

      // Set PDF viewer state
      console.log('📄 [Invoice PDF] Opening PDF viewer with URL:', invoicePdfUrl)
      currentPdfUrl.value = invoicePdfUrl
      showPdfViewer.value = true
      // Pass change amount to PDF viewer
      currentPdfUrl.value = invoicePdfUrl
      showPdfViewer.value = true
    } else {
      console.error('💰 [Payment] Missing invoice ID in payment result:', result)
      window.toastr?.['error']('Could not get invoice PDF')
    }
    
    // Release tables if this was a dine-in order
    if (invoiceResult.invoice.type === 'DINE_IN' && invoiceResult.invoice.tables_selected?.length) {
      try {
        await releaseTablesAfterPayment(invoiceResult.invoice.tables_selected)
      } catch (err) {
        console.error('Failed to release tables:', err)
        // Don't throw error here, as payment was successful
        window.toastr?.['warning']('Payment successful, but failed to update table status')
      }
    }
    
    // Emit success with invoice ID and close dialog
    const completeResult = {
      ...result,
      invoiceId: result?.regularResults?.[0]?.payment?.invoice_id || 
                result?.invoice_id || 
                invoiceResult?.invoice?.id || 
                invoiceResult?.id || 
                props.invoice?.id
    }
    
    emit('payment-complete', completeResult)
    dialog.value = false
    
    console.log(' [Payment] Payment completed with result:', {
      success: true,
      invoiceId: completeResult.invoiceId,
      paymentResult: result
    })
  } catch (err) {
    console.error(' [Payment] Payment failed:', err);
      
    lastError.value = {
      message: err.message,
      declineCode: err.declineCode,
      response: err.response?.data
    };
    
    // Get base message without TERMINAL_DECLINED prefix
    const rawMessage = err.message.replace('TERMINAL_DECLINED: ', '')
    const normalizedMessage = rawMessage.trim().toUpperCase()
    
    // Find matching error message
    userFriendlyError.value = errorMap[normalizedMessage] || 
                            errorMap[err.declineCode] || 
                            errorMap[err.message] || 
                            'Payment could not be processed'

    // Special case for BLOCKED 1ST USE even if code is UNKNOWN
    if (rawMessage.includes('BLOCKED 1ST USE')) {
      userFriendlyError.value = errorMap['BLOCKED 1ST USE']
    }
    
    showErrorDetails.value = true;
    window.toastr?.['error'](userFriendlyError.value);
      
    analytics.track('PaymentFailed', {
      error: userMessage,
      declineCode: err.response?.data?.GeneralResponse?.HostResponseCode,
      invoiceId: props.invoice?.id
    });
  } finally {
    processing.value = false
    
    // Track payment completion
    analytics.track('PaymentCompleted', {
      success: !error.value,
      invoiceId: props.invoice?.id,
      totalAmount: props.invoice?.total
    })
  }
}

// Initialize
watch(() => dialog.value, async (newValue) => {
  console.log('🪟 PaymentDialog - Watch triggered:', { newValue })
  if (newValue) {
    try {
      console.log('🪟 PaymentDialog - Initializing...')
      
      // Reset state
      payments.value = []
      processing.value = false
      tipAmount.value = 0
      selectedTipPercent.value = null
      customTipPercent.value = ''
      
      // Fetch required data
      console.log('Fetching company settings...')
      await fetchSettings()
      
      console.log('Fetching payment methods...')
      const methods = await fetchPaymentMethods()
      console.log('Fetched payment methods:', methods)
      
      if (!methods || methods.length === 0) {
        console.warn('No payment methods available')
        window.toastr?.warning('No payment methods available')
      }
      
      console.log('🪟 PaymentDialog - Initialization complete')
    } catch (error) {
      console.error('🪟 PaymentDialog - Initialization failed:', error)
      window.toastr?.['error']('Failed to initialize payment: ' + (error.message || 'Unknown error'))
      dialog.value = false
    }
  } else {
    console.log('🪟 PaymentDialog - Dialog closed')
  }
}, { immediate: true })
</script>

<style scoped>
.modal-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: rgb(var(--v-theme-surface));
  --v-card-border-radius: 24px;
  --v-card-elevation: 6;
}

.payment-toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: blur(12px);
  background-color: rgba(var(--v-theme-primary), 0.95) !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
  
  .v-toolbar-title {
    color: rgb(var(--v-theme-on-primary));
  }
  
  .v-btn {
    color: rgb(var(--v-theme-on-primary));
  }
}

.payment-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-background));
  padding: 24px;
}

@media (max-width: 960px) {
  .payment-content {
    padding: 16px;
  }
}

@media (max-width: 600px) {
  .payment-content {
    padding: 12px;
  }
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.payment-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

.invoice-summary-card {
  position: sticky;
  top: 16px;
  z-index: 1;
  border: 1px solid rgba(var(--v-border-color), 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }
}

.payment-methods-grid {
  margin: -8px;
}

.payment-method-btn {
  height: 64px !important;
  border-radius: 16px;
  text-transform: none;
  letter-spacing: 0.5px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: rgba(var(--v-theme-primary), 0.3);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }
  
  &.v-btn--disabled {
    opacity: 0.6;
    filter: grayscale(0.8);
  }
  
  .v-icon {
    transition: transform 0.2s ease;
  }
  
  &:hover .v-icon {
    transform: scale(1.1);
  }
}

.active-payments-section {
  margin-top: 24px;
}

.payment-section {
  margin-bottom: 16px;
  
  .v-card {
    border-radius: 12px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
  }
}

.tip-button {
  border-radius: 12px;
  font-weight: 500;
}

.process-payment-footer {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: rgba(var(--v-theme-surface), 0.9);
  border-top: 1px solid rgba(var(--v-border-color), 0.1);
  margin: 0 -16px -16px;
  backdrop-filter: blur(12px);
  z-index: 2;
}

.process-payment-btn {
  max-width: 600px;
  margin: 0 auto;
  border-radius: 16px;
  text-transform: none;
  letter-spacing: 0.5px;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }
  
  .v-icon {
    transition: transform 0.2s ease;
  }
  
  &:hover .v-icon {
    transform: scale(1.1);
  }
}

.error-alert {
  position: fixed;
  bottom: 88px;
  left: 16px;
  right: 16px;
  z-index: 2;
  max-width: 600px;
  margin: 0 auto;
}

/* Touch-friendly form inputs */
:deep(.v-text-field .v-field__input),
:deep(.v-select .v-field__input) {
  min-height: 44px;
  padding-top: 8px;
  font-size: 1rem;
}

:deep(.v-text-field .v-field__input input) {
  font-size: 1rem;
}

/* Enhanced spacing and layout */
:deep(.v-row) {
  margin-bottom: 20px;
}

:deep(.v-col) {
  padding: 12px;
}

/* Modern amount display styling */
.amount-display {
  margin-bottom: 24px;
  
  &__label {
    font-size: 1rem;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.87);
    margin-bottom: 8px;
  }
  
  &__value-container {
    background: rgb(var(--v-theme-surface));
    border: 2px solid rgba(var(--v-theme-primary), 0.15);
    border-radius: 16px;
    padding: 16px 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    
    &:hover {
      border-color: rgba(var(--v-theme-primary), 0.3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }
    
    &.is-error {
      border-color: rgb(var(--v-theme-error));
      background: linear-gradient(rgba(var(--v-theme-error), 0.02), rgba(var(--v-theme-error), 0.04));
    }
  }
  
  &__amount {
    font-size: 2rem;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
  }

  &__input {
    font-size: 2rem;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    border: none;
    background: transparent;
    width: 100%;
    padding: 0;
    margin: 0;
    
    &:focus {
      outline: none;
    }
    
    /* Hide spinner buttons */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    &[type=number] {
      -moz-appearance: textfield;
    }
  }
  
  &__currency {
    font-size: 2rem;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.87);
    margin-right: 2px;
  }
  
  &__error {
    margin-top: 8px;
    font-size: 0.875rem;
    color: rgb(var(--v-theme-error));
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: rgba(var(--v-theme-error), 0.05);
    border-radius: 8px;
  }
}

/* Fade transition for error messages */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
  
  :deep(.v-field__outline) {
    --v-field-border-width: 2px;
  }
  
  :deep(.v-label) {
    position: absolute;
    top: 8px;
    left: 36px;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
    background: transparent;
    padding: 0;
    margin: 0;
    line-height: 1;
    pointer-events: none;
    transform: none !important;
    opacity: 1;
  }

  :deep(.v-field--focused .v-label),
  :deep(.v-field--active .v-label) {
    color: rgb(var(--v-theme-primary));
  }
  
  :deep(.currency-symbol) {
    position: absolute;
    left: 16px;
    top: 58%;
    transform: translateY(-50%);
    color: rgba(var(--v-theme-on-surface), 0.85);
    font-size: 1.25rem;
    font-weight: 500;
    z-index: 1;
  }

  :deep(.v-field) {
    border-radius: 12px;
    background-color: rgb(var(--v-theme-surface));
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      transform: translateY(-1px);
    }

    &.v-field--focused {
      box-shadow: 0 6px 16px rgba(var(--v-theme-primary), 0.2);
      transform: translateY(-2px);
      
      .v-field__outline {
        border-color: rgb(var(--v-theme-primary));
        opacity: 1;
      }
    }
  }

  /* Improve number input appearance */
  :deep(input[type="number"]) {
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
  }

/* Quick amount selection buttons */
.denomination-btn {
  min-height: 44px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
}

/* Payment section cards */
.payment-section {
  .v-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    }
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .payment-input {
    :deep(.v-field__input) {
      font-size: 1rem;
    }
  }
  
  .denomination-btn {
    min-height: 40px;
    font-size: 0.95rem;
  }
}

/* Dialog transition */
.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
  transition: transform 0.3s ease-in-out;
}

.dialog-bottom-transition-enter-from,
.dialog-bottom-transition-leave-to {
  transform: translateY(100%);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .payment-container {
    padding: 12px;
  }
  
  .process-payment-footer {
    margin: 0 -12px -12px;
  }
  
  .invoice-summary-card {
    position: relative;
    top: 0;
  }
}

@media (max-width: 600px) {
  .payment-method-btn {
    height: 56px !important;
  }
  
  :deep(.v-card-title) {
    font-size: 1.1rem;
  }
  
  :deep(.v-card-text) {
    font-size: 0.95rem;
  }
}
</style>
