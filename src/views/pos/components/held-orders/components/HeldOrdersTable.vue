<!-- src/views/pos/components/held-orders/components/HeldOrdersTable.vue -->
<template>
  <div class="held-orders-table">
    <div class="filters-container">
      <div class="filters-row">
        <div class="search-field">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            label="Search orders"
            variant="outlined"
            density="compact"
            hide-details
            class="search-input"
          ></v-text-field>
        </div>

        <div class="filter-controls">
          <v-select
            v-model="selectedFilter"
            :items="filterItems"
            label="Type"
            variant="outlined"
            density="compact"
            hide-details
            class="filter-select"
            prepend-inner-icon="mdi-filter"
          ></v-select>

          <v-select
            v-model="selectedStatus"
            :items="statusItems"
            label="Status"
            variant="outlined"
            density="compact"
            hide-details
            class="filter-select"
            prepend-inner-icon="mdi-check-circle-outline"
          ></v-select>

          <v-select
            v-model="selectedPaymentStatus"
            :items="paymentStatusItems"
            label="Payment"
            variant="outlined"
            density="compact"
            hide-details
            class="filter-select"
            prepend-inner-icon="mdi-cash"
          ></v-select>
        </div>
      </div>
    </div>

    <div class="table-container">
      <v-table
        fixed-header
        class="orders-table"
      >
        <thead>
          <tr>
            <th class="text-left order-type-col">Order Type</th>
            <th class="text-left description-col">Description</th>
            <th class="text-left created-col">Created</th>
            <th class="text-center items-col">Items</th>
            <th class="text-right total-col">Total</th>
            <th class="text-left status-col">Status</th>
            <th v-if="!hideActions" class="text-center actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id">
            <td>
              <v-chip
                :color="getOrderTypeColor(getOrderType(invoice))"
                size="small"
                class="order-type-chip"
                variant="flat"
              >
                {{ getOrderType(invoice) }}
              </v-chip>
            </td>
            <td class="text-truncate" :style="{ maxWidth: $vuetify.display.mobile ? '150px' : '200px' }">
              <v-tooltip
                :text="getTooltipText(invoice)"
                location="top"
                open-delay="300"
              >
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="cursor-help">
                    {{ invoice.description }}
                    <v-icon
                      v-if="hasNotes(invoice)"
                      size="x-small"
                      color="grey-darken-1"
                      class="ml-1"
                    >
                      mdi-note-text-outline
                    </v-icon>
                  </span>
                </template>
              </v-tooltip>
            </td>
            <td>{{ formatDate(invoice.created_at) }}</td>
            <td class="text-center">{{ invoice.hold_items?.length || 0 }}</td>
            <td class="text-right">{{ formatCurrency(invoice.total / 100) }}</td>
            <td>
              <v-chip
                :color="getStatusColor(invoice.paid_status)"
                size="small"
                variant="flat"
                class="status-chip"
              >
                {{ invoice.paid_status || 'UNPAID' }}
              </v-chip>
            </td>
            <td v-if="!hideActions" class="text-center">
              <div class="actions-wrapper">
                <v-btn
                  size="small"
                  color="info"
                  variant="flat"
                  @click.prevent="$emit('load', invoice)"
                  :loading="loadingOrder === invoice.id"
                  :disabled="convertingOrder === invoice.id || deletingOrder === invoice.id || invoice.paid_status === 'PAID'"
                >
                  <v-icon size="small" class="mr-1">mdi-cart-arrow-down</v-icon>
                  LOAD
                </v-btn>
                <v-btn
                  size="small"
                  color="success"
                  variant="flat"
                  @click.prevent="$emit('convert', invoice)"
                  :loading="convertingOrder === invoice.id"
                  :disabled="loadingOrder === invoice.id || deletingOrder === invoice.id || invoice.paid_status === 'PAID'"
                >
                  <v-icon size="small" class="mr-1">mdi-cash-register</v-icon>
                  PAY
                </v-btn>
                <v-btn
                  size="small"
                  color="error"
                  variant="flat"
                  @click="$emit('delete', invoice)"
                  :loading="deletingOrder === invoice.id"
                  :disabled="loadingOrder === invoice.id || convertingOrder === invoice.id || invoice.paid_status === 'PAID'"
                >
                  <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                  DELETE
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <div v-if="showPagination" class="pagination-wrapper">
      <v-pagination
        :model-value="page"
        @update:model-value="$emit('update:page', $event)"
        :length="totalPages"
        :total-visible="7"
        rounded="circle"
      ></v-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { parseOrderNotes } from '../../../../../stores/cart/helpers'

const searchQuery = ref('')

const selectedFilter = ref('all')
const filterItems = [
  { title: 'All', value: 'all' },
  { title: 'Dine In', value: 'dine_in' },
  { title: 'To Go', value: 'to_go' },
  { title: 'Delivery', value: 'delivery' },
  { title: 'Pickup', value: 'pickup' }
]

const selectedStatus = ref('all')
const statusItems = [
  { title: 'All', value: 'all' },
  { title: 'Draft', value: 'DRAFT' },
  { title: 'Sent', value: 'SENT' },
  { title: 'Completed', value: 'COMPLETED' },
  { title: 'Cancelled', value: 'CANCELLED' }
]

const selectedPaymentStatus = ref('all')
const paymentStatusItems = [
  { title: 'All', value: 'all' },
  { title: 'Paid', value: 'PAID' },
  { title: 'Unpaid', value: 'UNPAID' },
  { title: 'Partially Paid', value: 'PARTIALLY_PAID' }
]

const props = defineProps({
  invoices: {
    type: Array,
    required: true
  },
  loadingOrder: {
    type: [String, Number],
    default: null
  },
  convertingOrder: {
    type: [String, Number],
    default: null
  },
  deletingOrder: {
    type: [String, Number],
    default: null
  },
  getOrderType: {
    type: Function,
    required: true
  },
  getOrderTypeColor: {
    type: Function,
    required: true
  },
  formatDate: {
    type: Function,
    required: true
  },
  formatCurrency: {
    type: Function,
    required: true
  },
  hideActions: {
    type: Boolean,
    default: false
  },
  showPagination: {
    type: Boolean,
    default: false
  },
  page: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['load', 'convert', 'delete', 'update:page', 'refresh'])

// Add logging utility
const logOrderInfo = (action, invoice) => {
  console.log(`[HeldOrdersTable] ${action}:`, {
    id: invoice.id,
    type: props.getOrderType(invoice),
    description: invoice.description,
    itemCount: invoice.hold_items?.length || 0,
    total: invoice.total,
    formattedTotal: props.formatCurrency(invoice.total / 100)
  })
}

// Payment Dialog
const showPaymentDialog = ref(false)
const showConfirmDialog = ref(false)
const selectedInvoice = ref(null)

const handlePayClick = (invoice) => {
  logOrderInfo('Payment initiated', invoice)
  selectedInvoice.value = invoice
  showConfirmDialog.value = true
}

const confirmPayment = () => {
  showConfirmDialog.value = false
  showPaymentDialog.value = true
}

const handlePaymentComplete = async (result) => {
  try {
    showPaymentDialog.value = false
    if (selectedInvoice.value) {
      console.log('[HeldOrdersTable] Payment completed:', {
        success: result,
        invoiceId: selectedInvoice.value.id
      })
    }
    selectedInvoice.value = null
    if (result) {
      window.toastr?.['success']('Payment processed successfully')
      emit('refresh')
    }
  } catch (error) {
    console.error('[HeldOrdersTable] Payment completion error:', error)
    window.toastr?.['error']('Failed to complete payment process')
  }
}

const hasNotes = (invoice) => {
  const notes = parseOrderNotes(invoice.notes)
  return notes && notes.trim().length > 0
}

const getTooltipText = (invoice) => {
  const notes = parseOrderNotes(invoice.notes)
  if (!notes) return invoice.description
  return `${invoice.description}\n\nNotes: ${notes}`
}

const getStatusColor = (status) => {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'UNPAID':
      return 'warning'
    default:
      return 'info'
  }
}

const handleConvert = (invoice) => {
  if (invoice.paid_status === 'PAID') {
    window.toastr?.['error']('Cannot convert a paid invoice')
    return
  }
  
  // Add is_hold_invoice flag to identify this as a hold invoice that needs conversion
  const holdInvoice = {
    ...invoice,
    is_hold_invoice: true
  }
  
  console.log('HeldOrdersTable: Convert button clicked for invoice:', holdInvoice)
  console.log('HeldOrdersTable: Emitting convert event with hold invoice data:', {
    id: holdInvoice.id,
    description: holdInvoice.description,
    total: holdInvoice.total,
    items: holdInvoice.hold_items?.length,
    is_hold_invoice: holdInvoice.is_hold_invoice
  })
  emit('convert', holdInvoice)
}

// Watch for prop changes to track loading states
watch(() => props.loadingOrder, (newVal, oldVal) => {
  if (newVal) {
    const invoice = props.invoices.find(i => i.id === newVal)
    if (invoice) {
      logOrderInfo('Loading order', invoice)
    }
  }
})

watch(() => props.convertingOrder, (newVal, oldVal) => {
  if (newVal) {
    const invoice = props.invoices.find(i => i.id === newVal)
    if (invoice) {
      logOrderInfo('Converting order', invoice)
    }
  }
})
</script>

<style scoped>
.held-orders-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: rgb(var(--v-theme-background));
}

.filters-container {
  flex: 0 0 auto;
  padding: 16px;
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.filters-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-field {
  flex: 1;
  max-width: 300px;
}

.filter-controls {
  flex: 1;
  display: flex;
  gap: 16px;
}

.filter-select {
  width: 160px;
}

.table-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
  position: relative;
}

.orders-table {
  height: 100%;
  width: 100%;
}

:deep(.v-table) {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-surface));
}

:deep(.v-table__wrapper) {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

:deep(.v-table__wrapper > table) {
  width: 100%;
  table-layout: fixed;
  border-spacing: 0;
}

:deep(.v-table__wrapper > table > thead) {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: rgb(var(--v-theme-surface));
}

:deep(.v-table__wrapper > table > thead > tr > th) {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 0 16px;
  height: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.v-table__wrapper > table > tbody > tr > td) {
  padding: 0 16px;
  height: 48px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.v-table__wrapper > table > tbody > tr:not(:last-child) > td) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Column widths */
.order-type-col { width: 12%; }
.description-col { width: 25%; }
.created-col { width: 12%; }
.items-col { width: 8%; }
.total-col { width: 10%; }
.status-col { width: 10%; }
.actions-col { width: 23%; }

.order-type-chip,
.status-chip {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.actions-wrapper {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
}

.pagination-wrapper {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  padding: 16px;
  background-color: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.cursor-help {
  cursor: help;
}

@media (max-width: 600px) {
  .filters-container {
    padding: 12px;
  }

  .filters-row {
    flex-direction: column;
    gap: 12px;
  }

  .search-field {
    width: 100%;
    max-width: none;
  }

  .filter-controls {
    width: 100%;
    gap: 8px;
  }

  .filter-select {
    width: auto;
    flex: 1;
  }

  :deep(.v-table__wrapper > table > thead > tr > th),
  :deep(.v-table__wrapper > table > tbody > tr > td) {
    padding: 0 12px;
    height: 40px;
    font-size: 0.875rem;
  }

  /* Adjust column widths for mobile */
  .order-type-col { width: 15%; }
  .description-col { width: 20%; }
  .created-col { width: 12%; }
  .items-col { width: 8%; }
  .total-col { width: 12%; }
  .status-col { width: 12%; }
  .actions-col { width: 21%; }

  .actions-wrapper {
    gap: 4px;
  }

  .pagination-wrapper {
    padding: 12px;
  }
}
</style>
