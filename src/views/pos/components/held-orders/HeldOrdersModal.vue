<!-- src/views/pos/components/held-orders/HeldOrdersModal.vue -->
<template>
  <div class="held-orders-container">
    <v-btn
      color="primary"
      prepend-icon="mdi-clipboard-list"
      @click="updateModelValue(true)"
      :disabled="disabled"
      class="text-none px-6 text-capitalize"
      rounded="pill"
      :elevation="$vuetify.display.mobile ? 1 : 2"
      size="large"
      :block="$vuetify.display.mobile"
    >
      <span class="text-subtitle-1 font-weight-medium">ORDERS</span>
    </v-btn>

    <v-dialog
      :model-value="modelValue"
      @update:model-value="updateModelValue"
      fullscreen
      transition="dialog-bottom-transition"
      :scrim="false"
    >
      <v-card class="modal-card">
        <v-toolbar
          color="primary"
          density="comfortable"
        >
          <v-toolbar-title class="text-h6 font-weight-medium">
            Orders Management
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon
            @click="updateModelValue(false)"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-tabs
          v-model="activeTab"
          bg-color="transparent"
          class="orders-tabs px-2"
          :show-arrows="false"
        >
          <v-tab 
            value="active" 
            class="tab-item flex-1 dine-in-tab"
            :class="{ 'tab-active': activeTab === 'active' }"
          >
            <v-icon start>mdi-silverware</v-icon>
            DINE IN | TOGO
          </v-tab>
          <v-tab 
            value="delivery" 
            class="tab-item flex-1 delivery-tab"
            :class="{ 'tab-active': activeTab === 'delivery' }"
          >
            <v-icon start>mdi-bike-fast</v-icon>
            DELIVERY | PICKUP
          </v-tab>
          <v-tab 
            value="invoices" 
            class="tab-item flex-1 history-tab"
            :class="{ 'tab-active': activeTab === 'invoices' }"
          >
            <v-icon start>mdi-history</v-icon>
            ORDER HISTORY
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="window-content">
          <v-window-item value="active" class="window-item">
            <held-orders-table
              :invoices="filteredActiveOrders"
              :loading-order="loadingOrder"
              :converting-order="convertingOrder"
              :deleting-order="deletingOrder"
              :get-order-type="getOrderType"
              :get-order-type-color="getOrderTypeColor"
              :format-date="formatDate"
              :format-currency="formatCurrency"
              @load="handleLoadOrder"
              @convert="handleConvertOrder"
              @delete="handleDeleteOrder"
              @order-loaded="handleOrderLoaded"
              class="table-component"
            />
          </v-window-item>

          <v-window-item value="delivery" class="window-item">
            <v-row no-gutters>
              <v-col cols="12">
                <div class="filters-container">
                  <v-row>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="deliverySearch"
                        label="Search"
                        density="comfortable"
                        hide-details
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        class="mb-2"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="deliverySelectedStatus"
                        :items="['ALL', 'DRAFT', 'SENT', 'COMPLETED']"
                        label="Status"
                        density="comfortable"
                        hide-details
                        variant="outlined"
                        class="mb-2"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="deliverySelectedPaymentStatus"
                        :items="['ALL', 'PAID', 'UNPAID']"
                        label="Payment Status"
                        density="comfortable"
                        hide-details
                        variant="outlined"
                        class="mb-2"
                      />
                    </v-col>
                  </v-row>
                </div>
              </v-col>
              <v-col cols="12">
                <order-invoices-table
                  :loading="deliveryLoading"
                  :invoices="filteredDeliveryOrders"
                  :get-order-type="getOrderType"
                  :get-order-type-color="getOrderTypeColor"
                  :format-date="formatDate"
                  :show-pagination="true"
                  :page="deliveryPage"
                  :total-pages="totalDeliveryPages"
                  @update:page="(page) => deliveryPage = page"
                  @refresh="fetchInvoices"
                  @load="handleLoadOrder"
                  @order-loaded="handleOrderLoaded"
                  class="table-component"
                />
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="invoices" class="window-item">
            <v-row no-gutters>
              <v-col cols="12">
                <div class="filters-container">
                  <v-row>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="invoiceSearch"
                        label="Search"
                        density="comfortable"
                        hide-details
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        class="mb-2"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="invoiceSelectedStatus"
                        :items="['ALL', 'DRAFT', 'SENT', 'COMPLETED']"
                        label="Status"
                        density="comfortable"
                        hide-details
                        variant="outlined"
                        class="mb-2"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="invoiceSelectedPaymentStatus"
                        :items="['ALL', 'PAID', 'UNPAID']"
                        label="Payment Status"
                        density="comfortable"
                        hide-details
                        variant="outlined"
                        class="mb-2"
                      />
                    </v-col>
                  </v-row>
                </div>
              </v-col>
              <v-col cols="12">
                <order-invoices-table
                  :loading="invoicesLoading"
                  :invoices="filteredInvoiceOrders"
                  :get-order-type="getOrderType"
                  :get-order-type-color="getOrderTypeColor"
                  :format-date="formatDate"
                  :show-pagination="true"
                  :page="invoicePage"
                  :total-pages="totalInvoicePages"
                  @update:page="(page) => invoicePage = page"
                  @refresh="fetchInvoices"
                  @load="handleLoadOrder"
                  @order-loaded="handleOrderLoaded"
                  class="table-component"
                />
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card>
    </v-dialog>

    <DeleteConfirmationDialog
      v-model="deleteDialog"
      :loading="isDeleting"
      :order-description="selectedInvoice?.description"
      @confirm="confirmDelete"
    />

    <PaymentDialog
      v-model="showPaymentDialog"
      :invoice="currentInvoice || {}"
      @payment-complete="handlePaymentComplete"
    />
  </div>
</template>

<style scoped>
.modal-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: rgb(var(--v-theme-background));
}

.window-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.window-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filters-container {
  padding: 8px 16px;
  background-color: rgb(var(--v-theme-background));
  border-bottom: 1px solid rgb(var(--v-theme-divider));
  margin: 0;
}

.filters-container :deep(.v-text-field),
.filters-container :deep(.v-select) {
  margin-bottom: 0 !important;
}

.filters-container :deep(.v-col) {
  padding-top: 4px;
  padding-bottom: 4px;
}

.table-component {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.orders-tabs {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  background-color: rgb(var(--v-theme-primary));
}

.orders-tabs :deep(.v-tabs-bar) {
  width: 100%;
}

.orders-tabs :deep(.v-slide-group__wrapper) {
  width: 100%;
}

.orders-tabs :deep(.v-slide-group__content) {
  width: 100%;
  display: flex;
  gap: 8px;
}

.tab-item {
  flex: 1;
  width: 100%;
  justify-content: center;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.0892857143em;
  border-radius: 12px 12px 0 0 !important;
  min-height: 56px;
  transition: all 0.2s ease-in-out;
  opacity: 0.85;
  border: 2px solid transparent;
  border-bottom: none;
  font-size: 1rem;
  padding-bottom: 8px;
}

.tab-item :deep(.v-tab__content) {
  font-size: 1.1rem;
  line-height: 1.2;
}

.tab-item :deep(.v-icon) {
  font-size: 1.4rem;
  margin-right: 8px;
}

.tab-item:hover {
  opacity: 0.95;
}

.tab-active {
  opacity: 1;
  transform: translateY(4px);
  padding-bottom: 12px;
}

.dine-in-tab {
  background-color: #2196F3 !important;
  color: white !important;
}

.dine-in-tab.tab-active {
  background-color: #1976D2 !important;
  border-color: #1565C0;
}

.delivery-tab {
  background-color: #4CAF50 !important;
  color: white !important;
}

.delivery-tab.tab-active {
  background-color: #388E3C !important;
  border-color: #2E7D32;
}

.history-tab {
  background-color: #FF9800 !important;
  color: white !important;
}

.history-tab.tab-active {
  background-color: #F57C00 !important;
  border-color: #EF6C00;
}

@media (max-width: 600px) {
  .tab-item {
    font-size: 0.95rem;
    min-height: 48px;
    padding-bottom: 6px;
  }
  
  .tab-active {
    padding-bottom: 10px;
  }

  .tab-item :deep(.v-icon) {
    font-size: 1.2rem;
  }
  
  .orders-tabs {
    padding: 8px 8px 0 8px !important;
  }
  
  .filters-container {
    padding: 8px;
  }
  
  .filters-container :deep(.v-col) {
    padding: 4px;
  }
}
</style>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { logger } from '../../../../utils/logger'
import { useHeldOrders } from './composables/useHeldOrders'
import { useInvoices } from './composables/useInvoices'
import { PriceUtils } from '@/utils/price'
import HeldOrdersFilters from './components/HeldOrdersFilters.vue'
import HeldOrdersTable from './components/HeldOrdersTable.vue'
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog.vue'
import PaymentDialog from '../dialogs/PaymentDialog.vue'
import OrderInvoicesTable from './components/OrderInvoicesTable.vue'
import { PaidStatus } from '../../../../types/order'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:model-value'])

const deleteDialog = ref(false)
const isDeleting = ref(false)
const selectedInvoice = ref(null)
const activeTab = ref('active')

// Active orders filters
const search = ref('')
const selectedStatus = ref('ALL')

// Invoice filters
const invoiceSearch = ref('')
const invoiceSelectedStatus = ref('COMPLETED')
const invoiceSelectedPaymentStatus = ref('PAID')
const invoicePage = ref(1)
const invoiceItemsPerPage = ref(10)

// Delivery & Pickup filters
const deliverySearch = ref('')
const deliverySelectedStatus = ref('SENT')
const deliverySelectedPaymentStatus = ref('UNPAID')
const deliveryPage = ref(1)
const deliveryLoading = ref(false)

const updateModelValue = (value) => {
  emit('update:model-value', value)
}

const {
  loading: holdOrdersLoading,
  loadingOrder,
  deletingOrder,
  convertingOrder,
  holdInvoices,
  getOrderType,
  getOrderTypeColor,
  formatDate,
  formatCurrency,
  convertToInvoice,
  loadOrder,
  deleteOrder,
  fetchHoldInvoices,
  showPaymentDialog,
  currentInvoice,
  handlePaymentComplete,
  clearOrderHistory
} = useHeldOrders()

const {
  loading: invoicesLoading,
  invoices,
  error: invoicesError,
  pagination: invoicesPagination,
  fetchInvoices
} = useInvoices()

const loading = computed(() => holdOrdersLoading || invoicesLoading)

// Computed properties for active orders
const activeOrders = computed(() => 
  holdInvoices.value.filter(invoice => invoice.paid_status === PaidStatus.UNPAID)
)

const filteredActiveOrders = computed(() => {
  let filtered = activeOrders.value

  if (selectedStatus.value !== 'ALL') {
    filtered = filtered.filter(invoice => invoice.paid_status === selectedStatus.value)
  }

  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    filtered = filtered.filter(invoice => 
      invoice.description?.toLowerCase().includes(searchTerm) ||
      invoice.id?.toString().includes(searchTerm)
    )
  }

  // Calculate pagination
  const startIndex = (invoicePage.value - 1) * invoiceItemsPerPage.value
  const paginatedData = filtered.slice(startIndex, startIndex + invoiceItemsPerPage.value)

  return paginatedData
})

const totalInvoicePages = computed(() => {
  return invoicesPagination.value.lastPage || 1
})

const filteredDeliveryOrders = computed(() => {
  if (!Array.isArray(invoices.value)) {
    logger.warn('Invoices is not an array:', invoices.value)
    return []
  }

  let filtered = invoices.value

  if (deliverySelectedStatus.value !== 'ALL') {
    filtered = filtered.filter(invoice => 
      invoice?.status === deliverySelectedStatus.value
    )
  }

  if (deliverySelectedPaymentStatus.value !== 'ALL') {
    filtered = filtered.filter(invoice =>
      invoice?.paid_status === deliverySelectedPaymentStatus.value
    )
  }

  if (deliverySearch.value) {
    const searchTerm = deliverySearch.value.toLowerCase()
    filtered = filtered.filter(invoice => 
      invoice?.invoice_number?.toLowerCase().includes(searchTerm) ||
      invoice?.customer?.name?.toLowerCase().includes(searchTerm) ||
      invoice?.id?.toString().includes(searchTerm)
    )
  }

  logger.debug('Filtered delivery orders:', {
    total: invoices.value.length,
    filtered: filtered.length,
    filters: {
      status: deliverySelectedStatus.value,
      paymentStatus: deliverySelectedPaymentStatus.value,
      search: deliverySearch.value
    }
  })

  return filtered
})

const totalDeliveryPages = computed(() => {
  return invoicesPagination.value.lastPage || 1
})

// Computed property for filtered invoices
const filteredInvoiceOrders = computed(() => {
  if (!Array.isArray(invoices.value)) {
    logger.warn('Invoices is not an array:', invoices.value)
    return []
  }

  let filtered = invoices.value

  if (invoiceSelectedStatus.value !== 'ALL') {
    filtered = filtered.filter(invoice => 
      invoice?.status === invoiceSelectedStatus.value
    )
  }

  if (invoiceSelectedPaymentStatus.value !== 'ALL') {
    filtered = filtered.filter(invoice =>
      invoice?.paid_status === invoiceSelectedPaymentStatus.value
    )
  }

  if (invoiceSearch.value) {
    const searchTerm = invoiceSearch.value.toLowerCase()
    filtered = filtered.filter(invoice => 
      invoice?.invoice_number?.toLowerCase().includes(searchTerm) ||
      invoice?.customer?.name?.toLowerCase().includes(searchTerm) ||
      invoice?.id?.toString().includes(searchTerm)
    )
  }

  logger.debug('Filtered invoice orders:', {
    total: invoices.value.length,
    filtered: filtered.length,
    filters: {
      status: invoiceSelectedStatus.value,
      search: invoiceSearch.value
    }
  })

  return filtered
})

const handleLoadOrder = async (invoice) => {
  logger.info('Loading order:', {
    id: invoice.id,
    description: invoice.description,
    type: invoice.type
  })
  
  const success = await loadOrder(invoice)
  if (success) {
    window.toastr?.['success']('Order loaded successfully')
    updateModelValue(false)
  } else {
    window.toastr?.['error']('Failed to load order')
  }
}

const handleConvertOrder = async (invoice) => {
  console.log('HeldOrdersModal - Initial invoice data:', {
    id: invoice.id,
    description: invoice.description,
    rawTotal: invoice.total,
    items: invoice.hold_items?.length,
    holdItems: invoice.hold_items?.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  })
  
  // Ensure the total is in cents using PriceUtils
  let finalTotal = PriceUtils.ensureCents(invoice.total)
  console.log('HeldOrdersModal - Normalized total:', {
    originalTotal: invoice.total,
    finalTotal: finalTotal,
    asDollars: PriceUtils.toDollars(finalTotal)
  })
  invoice.total = finalTotal
  
  // Also normalize item prices if they're in dollars
  if (invoice.hold_items) {
    invoice.hold_items = invoice.hold_items.map(item => ({
      ...item,
      price: item.price % 1 !== 0 ? PriceUtils.ensureCents(item.price) : item.price
    }))
  }
  
  const result = await convertToInvoice(invoice)
  console.log('HeldOrdersModal - Convert to invoice result:', {
    success: result.success,
    finalTotal: invoice.total,
    asDollars: PriceUtils.toDollars(invoice.total)
  })
  
  if (result.success) {
    console.log('HeldOrdersModal - Conversion successful')
  } else {
    console.error('HeldOrdersModal - Conversion failed:', result.error)
  }
}

const handleDeleteOrder = (invoice) => {
  if (!invoice?.id) {
    window.toastr?.['error']('Invalid order selected')
    return
  }
  selectedInvoice.value = invoice
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!selectedInvoice.value?.id) {
    window.toastr?.['error']('Invalid order selected')
    return
  }

  try {
    isDeleting.value = true
    const success = await deleteOrder(selectedInvoice.value.id)
    
    if (success) {
      deleteDialog.value = false
      await fetchHoldInvoices()
      window.toastr?.['success']('Order deleted successfully')
    }
  } catch (error) {
    window.toastr?.['error'](error.message || 'Failed to delete order')
  } finally {
    isDeleting.value = false
    selectedInvoice.value = null
  }
}

const handleOrderLoaded = (invoice) => {
  logger.info('Order loaded to cart:', {
    id: invoice.id,
    invoice_number: invoice.invoice_number
  })
  updateModelValue(false) // Close the modal
}

// Add event listener for order-loaded event
onMounted(() => {
  window.addEventListener('order-loaded', handleOrderLoadedEvent)
})

onUnmounted(() => {
  window.removeEventListener('order-loaded', handleOrderLoadedEvent)
})

// Handle order loaded event
const handleOrderLoadedEvent = (event) => {
  if (event.detail.success) {
    // Close the dialog
    updateModelValue(false)
    // Show success message if not already shown
    window.toastr?.['success']('Order loaded successfully')
  }
}

// Watch for dialog open to refresh the lists
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    await Promise.all([
      fetchHoldInvoices(),
      fetchInvoices()
    ])
  }
})

// Watch for tab activation
watch(activeTab, async (newValue) => {
  if (newValue === 'invoices') {
    await fetchInvoices({
      status: invoiceSelectedStatus.value !== 'ALL' ? invoiceSelectedStatus.value : '',
      invoiceNumber: invoiceSearch.value
    })
  } else if (newValue === 'delivery') {
    deliveryLoading.value = true
    try {
      await fetchInvoices({
        type: ['DELIVERY', 'PICKUP'],
        status: deliverySelectedStatus.value !== 'ALL' ? deliverySelectedStatus.value : '',
        invoiceNumber: deliverySearch.value,
        page: deliveryPage.value,
        orderByField: 'invoice_number',
        orderBy: 'desc'
      })
    } finally {
      deliveryLoading.value = false
    }
  }
})

// Watch for delivery filters changes
watch([deliverySearch, deliverySelectedStatus, deliverySelectedPaymentStatus, deliveryPage], async () => {
  if (activeTab.value === 'delivery') {
    deliveryLoading.value = true
    try {
      const params = {
        type: ['DELIVERY', 'PICKUP'],
        invoiceNumber: deliverySearch.value,
        page: deliveryPage.value,
        orderByField: 'invoice_number',
        orderBy: 'desc',
        per_page: 10
      }

      // Only add status and paid_status if they're not 'ALL'
      if (deliverySelectedStatus.value !== 'ALL') {
        params.status = deliverySelectedStatus.value
      }
      
      if (deliverySelectedPaymentStatus.value !== 'ALL') {
        params.paid_status = deliverySelectedPaymentStatus.value
      }

      await fetchInvoices(params)
    } finally {
      deliveryLoading.value = false
    }
  }
})

// Watch for invoice filters changes
watch([invoiceSearch, invoiceSelectedStatus, invoicePage], async () => {
  if (activeTab.value === 'invoices') {
    await fetchInvoices({
      status: invoiceSelectedStatus.value !== 'ALL' ? invoiceSelectedStatus.value : '',
      invoiceNumber: invoiceSearch.value,
      page: invoicePage.value,
      orderByField: 'invoice_number',
      orderBy: 'desc'
    })
  }
})

// Watch for payment completion
watch(showPaymentDialog, async (newValue) => {
  console.log('HeldOrdersModal: Payment dialog state changed:', {
    showPaymentDialog: newValue,
    hasCurrentInvoice: !!currentInvoice.value
  })
  
  if (!newValue) {
    // Payment dialog was closed
    if (currentInvoice.value) {
      console.log('HeldOrdersModal: Payment dialog closed with current invoice, refreshing list')
      // Refresh the list
      await fetchHoldInvoices()
      // Close the main dialog
      updateModelValue(false)
    }
  }
})

// Initial fetch
fetchHoldInvoices()
</script>
