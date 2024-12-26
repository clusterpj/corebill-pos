<template>
  <div class="bar-display">
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">Bar Display</h1>
        <v-chip
          :color="activeOrders.length > 0 ? 'warning' : 'success'"
          size="large"
          class="orders-count"
        >
          {{ activeOrders.length }} Active Orders
        </v-chip>
      </div>

      <!-- Tabs -->
      <v-tabs
        v-model="activeTab"
        color="primary"
        class="mb-4"
        grow
      >
        <v-tab value="active" class="text-subtitle-1">
          <v-icon icon="mdi-glass-cocktail" class="mr-2" />
          Active Orders
          <v-chip
            size="x-small"
            color="warning"
            class="ml-2"
            v-if="activeOrders.length"
          >
            {{ activeOrders.length }}
          </v-chip>
        </v-tab>
        <v-tab value="history" class="text-subtitle-1">
          <v-icon icon="mdi-history" class="mr-2" />
          Order History
          <v-chip
            size="x-small"
            color="success"
            class="ml-2"
            v-if="completedOrders.length"
          >
            {{ completedOrders.length }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-window v-model="activeTab">
        <!-- Active Orders -->
        <v-window-item value="active">
          <div v-if="loading" class="d-flex justify-center py-8">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            />
          </div>

          <div v-else-if="activeOrders.length === 0" class="text-center py-8">
            <v-icon
              icon="mdi-glass-mug-variant"
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            />
            <h3 class="text-h6 text-grey-darken-1">No Active Bar Orders</h3>
            <p class="text-body-1 text-medium-emphasis">
              All bar orders have been completed
            </p>
          </div>

          <v-row v-else>
            <v-col
              v-for="order in filteredActiveOrders"
              :key="order.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <bar-order-card
                :order="order"
                @complete="handleOrderComplete"
              />
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Order History -->
        <v-window-item value="history">
          <v-row v-if="completedOrders.length">
            <v-col
              v-for="order in filteredCompletedOrders"
              :key="order.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <bar-order-card
                :order="order"
                :completed="true"
              />
            </v-col>
          </v-row>
          <div v-else class="text-center py-8">
            <v-icon
              icon="mdi-history"
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            />
            <h3 class="text-h6 text-grey-darken-1">No Order History</h3>
            <p class="text-body-1 text-medium-emphasis">
              Completed bar orders will appear here
            </p>
          </div>
        </v-window-item>
      </v-window>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { logger } from '@/utils/logger'
import { OrderType } from '@/types/order'

// Store imports
import { useBarStore } from '@/stores/bar-store'
import { usePosStore } from '@/stores/pos-store'
import { useSectionStore } from '@/stores/section-store'
import { posApi } from '@/services/api/pos-api'
import BarOrderCard from './components/BarOrderCard.vue'

// Store setup
const barStore = useBarStore()
const posStore = usePosStore()
const sectionStore = useSectionStore()

const { activeOrders, completedOrders, loading, error } = storeToRefs(barStore)
const { holdInvoices } = storeToRefs(posStore)
const { barSections } = storeToRefs(sectionStore)

// UI State
const activeTab = ref('active')
const showError = ref(false)
const refreshing = ref(false)
const autoRefresh = ref(true)
let pollInterval: NodeJS.Timeout | null = null
let refreshInterval: NodeJS.Timeout | null = null

// Filtered orders (only bar section orders)
const filteredActiveOrders = computed(() => {
  return activeOrders.value.filter(order => {
    // Check if any item in the order belongs to a bar section
    return order.items.some(item => 
      barSections.value.some(section => 
        section.id === item.section_id
      )
    )
  })
})

const filteredCompletedOrders = computed(() => 
  completedOrders.value.filter(order => 
    filteredActiveOrders.value.some(activeOrder => activeOrder.type === order.type)
  )
)

// Error handling
watch(error, (newError) => {
  if (newError) {
    showError.value = true
  }
})

// Watch for changes in hold invoices
watch(holdInvoices, (newInvoices) => {
  if (newInvoices) {
    logger.debug('Updating bar orders from hold invoices:', newInvoices.length)
    barStore.initializeOrders(newInvoices)
  }
}, { deep: true })

// Watch for auto-refresh changes
watch(autoRefresh, (enabled) => {
  if (enabled) {
    startRefreshInterval()
  } else {
    stopRefreshInterval()
  }
})

// Methods
const handleOrderComplete = async (orderId: string) => {
  const success = await barStore.completeOrder(orderId)
  if (success) {
    // Optional: Play a sound or show a success notification
  }
}

const refreshOrders = async () => {
  if (refreshing.value) return
  
  refreshing.value = true
  try {
    await posStore.fetchHoldInvoices()
  } catch (err) {
    logger.error('Failed to refresh orders:', err)
    error.value = 'Failed to refresh orders. Please try again.'
  } finally {
    refreshing.value = false
  }
}

const startRefreshInterval = () => {
  stopRefreshInterval() // Clear any existing interval
  refreshInterval = setInterval(refreshOrders, 15000) // 15 seconds
}

const stopRefreshInterval = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Initialize orders from POS store
onMounted(async () => {
  try {
    await sectionStore.fetchSections()
    logger.debug('Bar sections loaded', barSections.value)
    logger.debug('Initializing bar display')

    // Fetch both hold invoices and direct invoices
    const [holdInvoicesResponse, directInvoicesResponse] = await Promise.all([
      posStore.fetchHoldInvoices(),
      posApi.invoice.getAll({ 
        types: [OrderType.BAR, OrderType.DINE_IN],
        status: ['pending', 'in_progress']
      })
    ])

    // Initialize bar store with both types
    barStore.initializeOrders(
      holdInvoicesResponse?.data || [],
      directInvoicesResponse?.data || []
    )
    
    // Start polling for updates
    pollInterval = setInterval(async () => {
      const [newHoldInvoices, newDirectInvoices] = await Promise.all([
        posStore.fetchHoldInvoices(),
        posApi.invoice.getAll({ 
          types: [OrderType.BAR, OrderType.DINE_IN],
          status: ['pending', 'in_progress']
        })
      ])
      
      barStore.initializeOrders(
        newHoldInvoices?.data || [],
        newDirectInvoices?.data || []
      )
    }, 30000) // Poll every 30 seconds
    
    // Start auto-refresh if enabled
    if (autoRefresh.value) {
      startRefreshInterval()
    }
  } catch (err) {
    logger.error('Failed to initialize bar orders:', err)
    error.value = 'Failed to load orders. Please refresh the page.'
  }
})

// Clean up on unmount
onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  stopRefreshInterval()
})
</script>

<style scoped>
.bar-display {
  min-height: 100vh;
  background-color: var(--v-background);
}

.orders-count {
  font-weight: 600;
}

:deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
}

@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.5rem !important;
  }
}
</style>
