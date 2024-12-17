<!-- src/views/pos/components/PosFooter.vue -->
<template>
  <v-footer app class="pos-footer">
    <div class="footer-content">
      <!-- Order Type Actions -->
      <div class="order-types">
        <held-orders-modal 
          v-model="showHeldOrdersModal"
          :disabled="false" 
        />
        <dine-in-modal :disabled="isDisabled" />
        <to-go-modal :disabled="isDisabled" />
        <delivery-modal :disabled="isDisabled" />
        <pickup-modal :disabled="isDisabled" />
      </div>

      <!-- Order Actions -->
      <div class="order-actions">
        <v-btn
          color="success"
          prepend-icon="mdi-cash-register"
          @click="handlePayment"
          :disabled="!canPay"
          :loading="isProcessingPayment"
          class="text-none action-btn"
          elevation="2"
          size="large"
        >
          PAY {{ PriceUtils.format(cartStore.total) }}
        </v-btn>
      </div>
    </div>

    <!-- Payment Dialog -->
    <retail-payment-dialog
      v-model="showPaymentDialog"
      @payment-complete="handlePaymentComplete"
    />
  </v-footer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import HeldOrdersModal from './held-orders/HeldOrdersModal.vue'
import DineInModal from './order-types/DineInModal.vue'
import ToGoModal from './order-types/ToGoModal.vue'
import DeliveryModal from './order-types/DeliveryModal.vue'
import PickupModal from './order-types/PickupModal.vue'
import PaymentDialog from './dialogs/PaymentDialog.vue'
import RetailPaymentDialog from './dialogs/RetailPaymentDialog.vue'
import { useCartStore } from '@/stores/cart-store'
import { useCompanyStore } from '@/stores/company'
import { usePayment } from '../composables/usePayment'
import { logger } from '@/utils/logger'
import { convertHeldOrderToInvoice } from './held-orders/utils/invoiceConverter'
import { usePosStore } from '@/stores/pos-store'
import { PriceUtils } from '@/utils/price'

const cartStore = useCartStore()
const companyStore = useCompanyStore()
const posStore = usePosStore()
const { isProcessingPayment } = usePayment()

// Local state
const showPaymentDialog = ref(false)
const currentInvoice = ref(null)
const showHeldOrdersModal = ref(false)

// Use storeToRefs to maintain reactivity for store state
const { items, holdInvoiceId } = storeToRefs(cartStore)
const { isConfigured } = storeToRefs(companyStore)

// Compute if cart is empty based on items length
const isEmpty = computed(() => items.value.length === 0)

// Compute disabled state for all buttons
const isDisabled = computed(() => {
  return isEmpty.value || !isConfigured.value
})

// Compute if payment can be processed
const canPay = computed(() => {
  const canPayValue = !isEmpty.value && isConfigured.value
  logger.debug('Can pay computed:', {
    isEmpty: isEmpty.value,
    isConfigured: isConfigured.value,
    canPay: canPayValue
  })
  return canPayValue
})

// Handle payment initiation
const handlePayment = async () => {
  logger.debug('Handle payment called')
  showPaymentDialog.value = true
}

// Handle payment completion
const handlePaymentComplete = async (result) => {
  logger.info('Payment completion handler called with result:', result)
  
  if (result) {
    // Clear the cart after successful payment
    await cartStore.$reset()
    window.toastr?.['success']('Payment processed successfully')
  }
  
  showPaymentDialog.value = false
}

// Debug mounted state
onMounted(() => {
  logger.debug('PosFooter mounted:', {
    isEmpty: isEmpty.value,
    isConfigured: isConfigured.value,
    holdInvoiceId: holdInvoiceId.value,
    canPay: canPay.value,
    items: items.value.length
  })
})

defineEmits(['print-order', 'submit-order'])
</script>

<style scoped>
.pos-footer {
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
  padding: 8px 24px !important;
  width: 100% !important;
  height: auto !important;
  min-height: 72px;
  background-color: #f8f9fa !important;
}

.footer-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 32px;
}

.order-types {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  flex-shrink: 1;
  min-width: 0;
  justify-content: flex-end;
}

.order-types :deep(.v-btn) {
  flex: 0 0 auto !important;
  min-width: 100px !important;
  max-width: 130px !important;
  padding: 0 16px !important;
  height: 48px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  letter-spacing: 0.25px !important;
  font-weight: 500 !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  transition: all 0.2s ease-in-out !important;
}

.order-types :deep(.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
}

.order-types :deep(.v-btn:active) {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.action-btn {
  white-space: nowrap;
  min-width: 160px !important;
  height: 48px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  letter-spacing: 0.25px !important;
  font-weight: 600 !important;
  font-size: 1.1rem !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  transition: all 0.2s ease-in-out !important;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
}

.action-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

/* Large screens */
@media (min-width: 1441px) {
  .pos-footer {
    padding: 12px 32px !important;
  }
  
  .footer-content {
    gap: 48px;
  }
  
  .order-types {
    gap: 16px;
  }

  .order-types :deep(.v-btn) {
    min-width: 120px !important;
    max-width: 160px !important;
    height: 52px !important;
  }
  
  .order-actions {
    gap: 24px;
  }

  .action-btn {
    min-width: 180px !important;
    height: 52px !important;
  }
}

/* Medium-large screens */
@media (max-width: 1440px) {
  .pos-footer {
    padding: 8px 20px !important;
  }
  
  .footer-content {
    gap: 24px;
  }

  .order-types :deep(.v-btn) {
    min-width: 110px !important;
    max-width: 140px !important;
    padding: 0 12px !important;
  }
}

/* Medium screens - where the issue starts */
@media (max-width: 1280px) {
  .pos-footer {
    padding: 12px !important;
  }

  .footer-content {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .order-types {
    flex: 0 1 auto;
    justify-content: flex-end;
    gap: 8px;
  }

  .order-types :deep(.v-btn) {
    min-width: 90px !important;
    max-width: 120px !important;
    padding: 0 8px !important;
  }

  .order-actions {
    flex: 0 0 auto;
    gap: 8px;
  }

  .action-btn {
    min-width: 90px !important;
  }
}

/* Small screens */
@media (max-width: 768px) {
  .pos-footer {
    padding: 8px !important;
  }

  .footer-content {
    gap: 6px;
  }

  .order-types {
    gap: 6px;
  }

  .order-types :deep(.v-btn) {
    min-width: 80px !important;
    max-width: 110px !important;
    padding: 0 6px !important;
  }

  .action-btn {
    min-width: 80px !important;
    padding: 0 8px !important;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .pos-footer {
    padding: 8px 4px !important;
  }

  .footer-content {
    gap: 4px;
  }

  .order-types {
    gap: 4px;
  }

  .order-types :deep(.v-btn) {
    min-width: 70px !important;
    max-width: 100px !important;
    padding: 0 4px !important;
  }

  .order-actions {
    gap: 4px;
  }

  .action-btn {
    min-width: 70px !important;
    padding: 0 6px !important;
  }
}
</style>
