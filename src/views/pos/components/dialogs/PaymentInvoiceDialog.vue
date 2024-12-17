<!-- src/views/pos/components/dialogs/PaymentDialog.vue -->
<template>
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
      >
        <v-toolbar-title class="text-h6 font-weight-medium">
          <v-icon icon="mdi-cash-register" size="large" class="mr-2"></v-icon>
          Process Payment
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          class="mr-2"
          @click="loadToCart"
          :disabled="!canLoadToCart"
        >
          <v-icon start>mdi-cart-arrow-down</v-icon>
          Load to Cart
        </v-btn>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
          class="ml-2"
          size="large"
        ></v-btn>
      </v-toolbar>

      <div class="payment-content">
          <v-container class="payment-container">
          <!-- Loading State -->
          <v-row v-if="loading">
            <v-col cols="12">
              <v-sheet class="pa-3">
                <v-skeleton-loader
                  type="article, actions"
                  class="mx-auto"
                ></v-skeleton-loader>
              </v-sheet>
            </v-col>
          </v-row>

          <template v-else>
            <v-row>
              <!-- Left Column - Invoice Summary & Tip -->
              <v-col cols="12" md="4">
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
                    <div class="d-flex justify-space-between">
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
                  class="mb-4"
                >
                  {{ tipAmount > 0 ? `Update Tip (${formatCurrency(tipAmount / 100)})` : 'Add Tip' }}
                </v-btn>
              </v-col>

              <!-- Right Column - Payment Methods -->
              <v-col cols="12" md="8">
                <div class="text-subtitle-1 mb-3 font-weight-medium">Select Payment Method</div>
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
                      :disabled="isMethodDisabled(method.id)"
                      @click="selectPaymentMethod(method.id)"
                    >
                      <v-icon :icon="getPaymentMethodIcon(method.name)" class="mr-2"></v-icon>
                      {{ method.name }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <!-- Active Payment Methods -->
            <v-row v-if="payments.length > 0">
              <v-col cols="12">
                <div v-for="(payment, index) in payments" :key="index" class="payment-section mb-4">
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

                    <!-- Change Amount Display -->
                    <v-card
                      v-if="payment.returned > 0"
                      color="primary"
                      class="change-amount-card mb-2"
                    >
                      <v-card-text class="pa-3">
                        <div class="d-flex justify-space-between align-center">
                          <span class="text-h6 font-weight-medium">Change Due:</span>
                          <span class="text-h5 font-weight-bold">{{ formatCurrency(payment.returned / 100) }}</span>
                        </div>
                      </v-card-text>
                    </v-card>
                  </template>

                  <!-- Payment Fees -->
                  <div v-if="hasPaymentFees(payment.method_id)" class="text-caption mb-2">
                    <div class="d-flex justify-space-between">
                      <span>Service Fee:</span>
                      <strong>{{ formatCurrency(payment.fees / 100) }}</strong>
                    </div>
                    <div class="text-grey">
                      {{ getFeeDescription(payment.method_id, payment.amount) }}
                    </div>
                  </div>

                  <v-divider v-if="index < payments.length - 1" class="my-4"></v-divider>
                  </v-card>
                </div>

                <!-- Add Payment Method Button -->
                <v-btn
                  v-if="canAddMorePayments"
                  color="primary"
                  variant="outlined"
                  size="small"
                  class="mt-2"
                  @click="addPayment"
                >
                  Add Payment Method
                </v-btn>

                <!-- Total with Fees -->
                <v-card v-if="totalFees > 0" variant="outlined" class="mt-4">
                  <v-card-text>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Subtotal:</span>
                      <strong>{{ formatCurrency(totalPayments / 100) }}</strong>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Service Fees:</span>
                      <strong>{{ formatCurrency(totalFees / 100) }}</strong>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span>Total:</span>
                      <strong>{{ formatCurrency((totalPayments + totalFees) / 100) }}</strong>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Error Message -->
            <v-row v-if="error">
              <v-col cols="12">
                <v-alert type="error" variant="tonal">
                  {{ error }}
                </v-alert>
              </v-col>
            </v-row>
          </template>
        </v-container>
      </div>

      <v-card-actions class="pa-4">
        <v-btn
          block
          color="primary"
          variant="flat"
          size="large"
          height="56"
          :loading="processing"
          :disabled="!isValid || processing"
          @click="processPayment"
          class="process-payment-btn"
        >
          Process Payment
        </v-btn>
      </v-card-actions>
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
              <strong>{{ formatCurrency(calculatedTip / 100) }}</strong>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePayment } from '../../composables/usePayment'
import { useTableManagement } from '../../composables/useTableManagement'
import { useCartStore } from '@/stores/cart-store'
import { useCompanyStore } from '@/stores/company'
import { convertHeldOrderToInvoice } from '../held-orders/utils/invoiceConverter'
import { posApi } from '@/services/api/pos-api'
import { PriceUtils } from '@/utils/price'

const cartStore = useCartStore()
const companyStore = useCompanyStore()

const props = defineProps({
  modelValue: Boolean,
  createInvoiceOnly: {
    type: Boolean,
    default: false
  },
  invoice: {
    type: Object,
    required: false,
    default: () => ({
      invoice: {},
      invoicePrefix: '',
      nextInvoiceNumber: ''
    })
  }
})

const emit = defineEmits(['update:modelValue', 'payment-complete'])

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
} = usePayment()

const {
  loading: tableLoading,
  error: tableError,
  releaseTablesAfterPayment
} = useTableManagement()

const loading = computed(() => paymentLoading.value || tableLoading.value)
const error = computed(() => paymentError.value || tableError.value)

const processing = ref(false)
const payments = ref([])

const canLoadToCart = computed(() => {
  return ['DRAFT', 'SENT'].includes(props.invoice?.invoice?.status)
})

const loadToCart = async () => {
  try {
    await cartStore.loadInvoice(props.invoice.invoice)
    window.toastr?.success('Invoice loaded to cart successfully')
    dialog.value = false
  } catch (error) {
    console.error('Failed to load invoice to cart:', error)
    window.toastr?.error('Failed to load invoice to cart')
  }
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

const invoiceTotal = computed(() => {
  return PriceUtils.normalizePrice(props.invoice?.invoice?.total || 0)
})

const calculatedTip = computed(() => {
  const percent = selectedTipPercent.value || Number(customTipPercent.value) || 0
  return Math.round((invoiceTotal.value * percent) / 100)
})

// Dialog computed property
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const remainingAmount = computed(() => {
  const totalPaid = payments.value.reduce((sum, payment) => {
    return sum + PriceUtils.normalizePrice(payment.amount)
  }, 0)
  return PriceUtils.normalizePrice(invoiceTotal.value + tipAmount.value - totalPaid)
})

const totalPayments = computed(() => {
  return payments.value.reduce((sum, payment) => {
    return sum + payment.amount
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
  return PriceUtils.formatInvoiceAmount(amount)
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
  const displayAmount = (remaining / 100).toString()
  
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
  payment.displayReceived = money.amount.toString()
  payment.received = Math.round(Number(money.amount) * 100)
  calculateChange(index)
}

const calculateChange = (index) => {
  const payment = payments.value[index]
  if (!payment.displayReceived || !payment.displayAmount) return

  const received = Math.round(Number(payment.displayReceived) * 100)
  const amount = payment.amount
  
  payment.received = received
  
  if (received >= amount) {
    payment.returned = received - amount
  } else {
    payment.returned = 0
  }
}

const validateAmount = (index) => {
  const payment = payments.value[index]
  if (!payment.displayAmount) return

  // Set full payment amount including tip
  payment.displayAmount = ((invoiceTotal.value + tipAmount.value) / 100).toString()

  // Convert display amount to cents
  payment.amount = Math.round(Number(payment.displayAmount) * 100)

  // Calculate fees if applicable
  if (hasPaymentFees(payment.method_id)) {
    payment.fees = calculateFees(payment.method_id, payment.amount)
  }

  // Set initial received amount for cash payments
  if (isCashOnly(payment.method_id)) {
    payment.displayReceived = payment.displayAmount
    payment.received = payment.amount
    payment.returned = 0
  }
}

const addPayment = () => {
  payments.value.push({ 
    method_id: null, 
    amount: 0,
    displayAmount: ((invoiceTotal.value + tipAmount.value) / 100).toString(), // Include tip
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
  console.log('PaymentDialog: Starting payment processing', {
    isValid: isValid.value,
    processing: processing.value,
    invoiceTotal: invoiceTotal.value,
    tipAmount: tipAmount.value,
    payments: payments.value,
    invoice: props.invoice
  })

  if (!isValid.value || processing.value) {
    console.log('PaymentDialog: Cannot process - validation failed or already processing')
    return
  }

  processing.value = true
  try {
    console.log('PaymentDialog: Starting invoice creation with props:', {
      invoice: props.invoice,
      hasInvoiceData: !!props.invoice?.invoice,
      invoiceTotal: invoiceTotal.value,
      tipAmount: tipAmount.value
    })

    let finalInvoice
    const invoiceData = props.invoice?.invoice || props.invoice

    if (!invoiceData) {
      throw new Error('Invoice data not provided')
    }

    console.log('PaymentDialog: Processing invoice data:', {
      invoiceData,
      isHoldInvoice: invoiceData.is_hold_invoice,
      total: invoiceData.total,
      dueAmount: invoiceData.due_amount
    })

    // Calculate the total with tip
    const totalWithTip = invoiceTotal.value + tipAmount.value
    const tipPercentage = selectedTipPercent.value || Number(customTipPercent.value) || 0

    // Check if we're dealing with a hold invoice or a regular invoice
    if (invoiceData.is_hold_invoice) {
      console.log('PaymentDialog: Processing hold invoice conversion')
      
      // First convert the hold invoice to a regular invoice
      const holdInvoice = {
        ...invoiceData,
        tip: String(Math.round(tipPercentage)),
        tip_type: "percentage",
        tip_val: tipAmount.value,
        total: totalWithTip,
        due_amount: totalWithTip,
        sub_total: invoiceTotal.value
      }

      // Convert hold invoice to regular invoice using the converter
      const invoiceResult = await convertHeldOrderToInvoice(holdInvoice)
      
      if (!invoiceResult.success) {
        console.error('Hold invoice conversion failed:', invoiceResult.error)
        throw new Error(invoiceResult.error || 'Failed to create invoice from hold order')
      }

      // Log the conversion result
      console.log('Hold invoice converted successfully:', {
        holdInvoiceId: holdInvoice.id,
        newInvoiceId: invoiceResult.invoice.id,
        invoiceNumber: invoiceResult.invoice.invoice_number
      })

      // Structure the final invoice with the new invoice data
      finalInvoice = {
        invoice: {
          ...invoiceResult.invoice,
          // Ensure we use the new invoice ID and number
          id: invoiceResult.invoice.id,
          invoice_number: invoiceResult.invoice.invoice_number,
          // Preserve reference to original hold invoice
          hold_invoice_id: holdInvoice.id,
          // Include payment-specific fields
          tip: String(Math.round(tipPercentage)),
          tip_type: "percentage",
          tip_val: tipAmount.value,
          total: totalWithTip,
          due_amount: totalWithTip,
          sub_total: invoiceTotal.value
        }
      }
    } else {
      // Process regular invoice
      finalInvoice = {
        invoice: {
          ...invoiceData,
          tip: String(Math.round(tipPercentage)),
          tip_type: "percentage",
          tip_val: tipAmount.value,
          total: totalWithTip,
          due_amount: totalWithTip,
          sub_total: invoiceTotal.value
        }
      }
    }

    // Add to held orders if in create-invoice-only mode
    if (props.createInvoiceOnly) {
      try {
        const heldOrderData = {
          ...finalInvoice,
          is_hold_invoice: true,
          status: 'HELD',
          description: finalInvoice.description || 'Delivery Order'
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

    // Get current company store
    const companyStore = useCompanyStore()

    // Format payments for API - amounts are already in cents
    const formattedPayments = payments.value.map(payment => ({
      method_id: payment.method_id,
      name: getPaymentMethod(payment.method_id).name,
      amount: payment.amount,
      received: payment.received,
      returned: payment.returned,
      valid: true
    }))

    // Validate total payment amount matches invoice total
    const totalPaymentAmount = formattedPayments.reduce((sum, payment) => sum + payment.amount, 0)
    console.log('Payment validation:', {
      totalPaymentAmount,
      totalWithTip,
      difference: Math.abs(totalPaymentAmount - totalWithTip)
    })
    
    if (Math.abs(totalPaymentAmount - totalWithTip) > 1) { // Allow for 1 cent rounding difference
      throw new Error(`Payment amount (${totalPaymentAmount}) must match invoice total including tip (${totalWithTip})`)
    }

    // Create payment using the final invoice
    console.log('Final invoice for payment:', finalInvoice)
    
    // Ensure we have the correct invoice ID and number
    const invoiceId = finalInvoice.invoice?.id || finalInvoice.id
    const invoiceNumber = finalInvoice.invoice?.invoice_number || finalInvoice.invoice_number || invoiceId
    
    if (!invoiceId) {
      throw new Error('Invalid invoice: missing ID')
    }

    console.log('PaymentDialog: Final invoice details:', {
      invoiceId,
      invoiceNumber,
      total: finalInvoice.total || finalInvoice.invoice?.total,
      dueAmount: finalInvoice.due_amount || finalInvoice.invoice?.due_amount
    })

    console.log('Processing payment with:', {
      invoiceId,
      invoiceNumber,
      finalInvoice,
      payments: formattedPayments
    })

    // Create payment with the correct invoice reference
    const result = await createPayment({
      ...finalInvoice,
      id: invoiceId,
      invoice_number: invoiceNumber
    }, formattedPayments)
    
    // Release tables if this was a dine-in order
    if (finalInvoice.type === 'DINE_IN' && finalInvoice.tables_selected?.length) {
      try {
        await releaseTablesAfterPayment(invoiceResult.invoice.tables_selected)
      } catch (err) {
        console.error('Failed to release tables:', err)
        // Don't throw error here, as payment was successful
        window.toastr?.['warning']('Payment successful, but failed to update table status')
      }
    }
    
    // Emit success
    emit('payment-complete', result)
    
    // Close dialog
    dialog.value = false
  } catch (err) {
    console.error('Payment failed:', err)
    window.toastr?.['error'](err.message || 'Failed to process payment')
  } finally {
    processing.value = false
  }
}

// Initialize
watch(() => dialog.value, async (newValue) => {
  if (newValue) {
    try {
      // Get company settings
      await fetchSettings()

      // Reset payments array
      payments.value = []
      processing.value = false
      
      // Reset tip state
      tipAmount.value = 0
      selectedTipPercent.value = null
      customTipPercent.value = ''
      
      // Fetch payment methods
      await fetchPaymentMethods()
    } catch (error) {
      console.error('Failed to initialize payment dialog:', error)
      window.toastr?.['error']('Failed to initialize payment')
      dialog.value = false
    }
  }
})
</script>

<style scoped>
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
  
  &__currency {
    font-size: 2rem;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.87);
    margin-right: 2px;
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

.payment-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-background));
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
  background: linear-gradient(145deg, var(--v-surface-variant) 0%, var(--v-surface-base) 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.invoice-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
}

.payment-method-btn {
  height: 64px !important;
  border-radius: 12px;
  text-transform: none;
  letter-spacing: 0.5px;
  font-size: 1rem;
  font-weight: 500;
  
  &:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease;
  }
  
  &.v-btn--disabled {
    opacity: 0.7;
  }
}

.payment-method-btn:hover {
  transform: translateY(-2px);
}

.v-card-text {
  font-size: 1.1rem;
  line-height: 1.6;
}

/* Responsive Typography */
.text-h5 {
  font-size: 1.1rem !important;
  font-weight: 500;
}

.text-h6 {
  font-size: 1rem !important;
  font-weight: 500;
}

.text-subtitle-1 {
  font-size: 0.9rem !important;
}

/* Touch Targets */
@media (max-width: 600px) {
  .payment-method-btn {
    min-height: 56px;
    width: 100%;
  }
  
  .v-btn {
    min-height: 48px;
  }
  
  .v-text-field :deep(input) {
    font-size: 16px !important; /* Prevent zoom on iOS */
  }
}

/* Transitions */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.v-card-title {
  font-size: 1.2rem !important;
  padding: 16px 20px !important;
}

.text-h5 {
  font-size: 1.2rem !important;
}

.text-h6 {
  font-size: 1.1rem !important;
}

.text-subtitle-1 {
  font-size: 1rem !important;
  font-weight: 500;
}

.text-subtitle-2 {
  font-size: 0.9rem !important;
}

.payment-method-btn {
  text-transform: none;
  letter-spacing: normal;
  font-size: 1rem;
  height: 60px !important;
}

.payment-method-btn .v-icon {
  font-size: 1.8rem;
  margin-right: 12px;
}

.payment-section {
  border-radius: 12px;
  transition: all 0.3s ease;
  margin-bottom: 24px !important;
}

.payment-section:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.v-text-field {
  font-size: 1rem;
}

.v-text-field :deep(input) {
  font-size: 1rem !important;
}

.v-text-field :deep(label) {
  font-size: 0.9rem !important;
}

.v-btn {
  font-size: 0.9rem;
  padding: 0 16px;
  height: 36px;
}

.v-btn--size-small {
  height: 32px;
  font-size: 0.85rem;
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
  
  .v-card {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .v-card-text {
    flex: 1;
    overflow-y: auto;
  }
}

.process-payment-btn {
  font-size: 1.1rem !important;
  letter-spacing: 0.5px;
  font-weight: 500;
  border-radius: 12px;
  text-transform: none;
}

.change-amount-card {
  border-radius: 8px;
  background: linear-gradient(135deg, var(--v-primary-base) 0%, var(--v-primary-darken1) 100%);
  color: white !important;
  
  .v-card-text {
    color: white !important;
  }
  
  .text-h5 {
    color: white !important;
  }
  
  .text-h6 {
    color: white !important;
  }
}

/* Additional spacing improvements */
.v-container {
  padding: 8px;
}

.v-row {
  margin-bottom: 8px;
}

.v-col {
  padding: 2px;
}

.mb-2 {
  margin-bottom: 8px !important;
}

.mb-4 {
  margin-bottom: 16px !important;
}

.mr-2 {
  margin-right: 8px !important;
}

.pa-4 {
  padding: 16px !important;
}
</style>
