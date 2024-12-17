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
        density="comfortable"
      >
        <v-toolbar-title class="text-h6 font-weight-medium">
          <v-icon :icon="props.invoice?.invoice?.type === 'PICKUP' ? 'mdi-store-clock' : 'mdi-truck-delivery'" size="large" class="mr-2"></v-icon>
          {{ props.invoice?.invoice?.type === 'PICKUP' ? 'Process Pick Up Order' : 'Process Delivery Order' }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="closeDialog"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 fill-height d-flex flex-column">
        <v-container fluid class="flex-grow-1 pa-4">
          <v-row>
            <v-col cols="12" class="text-center">
              <v-icon icon="mdi-check-circle" color="success" size="64" class="mb-4"></v-icon>
              <h2 class="text-h5 mb-4">{{ props.invoice?.invoice?.type === 'PICKUP' ? 'Pick Up Order Created Successfully' : 'Delivery Order Created Successfully' }}</h2>
              <v-card variant="outlined" class="invoice-summary-card mb-4">
                <v-card-text class="py-4">
                  <div class="d-flex justify-space-between mb-2">
                    <span>Invoice Number:</span>
                    <strong>{{ invoiceNumber }}</strong>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Total Amount:</span>
                    <strong>{{ formatCurrency(invoiceTotal / 100) }}</strong>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          size="large"
          min-width="120"
          height="48"
          @click="closeDialog"
          class="text-none px-6"
          rounded="pill"
          elevation="2"
        >
          <v-icon start icon="mdi-check" class="mr-1"></v-icon>
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { posApi } from '@/services/api/pos-api'
import { logger } from '@/utils/logger'
import { useCompanyStore } from '@/stores/company'
import { convertHeldOrderToInvoice } from '../held-orders/utils/invoiceConverter'

const props = defineProps({
  modelValue: Boolean,
  invoice: {
    type: Object,
    required: true,
    default: () => ({
      invoice: {},
      invoicePrefix: '',
      nextInvoiceNumber: ''
    })
  }
})

const emit = defineEmits(['update:modelValue', 'payment-complete'])

// State
const loading = ref(false)
const processing = ref(false)
const error = ref(null)

// Dialog computed property
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Computed properties for invoice details
const invoiceNumber = computed(() => {
  return props.invoice?.invoice?.invoice_number || 
         `${props.invoice?.invoicePrefix}-${props.invoice?.nextInvoiceNumber}` || 
         ''
})

const invoiceTotal = computed(() => {
  return props.invoice?.invoice?.total || 0
})

// Methods
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const closeDialog = () => {
  emit('payment-complete', true)
  dialog.value = false
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

.invoice-summary-card {
  max-width: 600px;
  margin: 0 auto;
}

:deep(.v-card-actions) {
  background-color: rgb(var(--v-theme-surface));
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 12px 24px;
}
</style>
