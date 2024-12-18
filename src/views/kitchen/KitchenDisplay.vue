<template>
  <div class="kitchen-display">
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">Kitchen Display</h1>
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
          <v-icon icon="mdi-clock-outline" class="mr-2" />
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
              icon="mdi-coffee-outline"
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            />
            <h3 class="text-h6 text-grey-darken-1">No Active Orders</h3>
            <p class="text-body-1 text-medium-emphasis">
              All orders have been completed
            </p>
          </div>

          <v-row v-else>
            <v-col
              v-for="order in activeOrders"
              :key="order.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <kitchen-order-card
                :order="order"
                @complete="handleOrderComplete"
              />
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Order History -->
        <v-window-item value="history">
          <div v-if="loading" class="d-flex justify-center py-8">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            />
          </div>

          <div v-else-if="completedOrders.length === 0" class="text-center py-8">
            <v-icon
              icon="mdi-history"
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            />
            <h3 class="text-h6 text-grey-darken-1">No Completed Orders</h3>
            <p class="text-body-1 text-medium-emphasis">
              Completed orders will appear here
            </p>
          </div>

          <v-row v-else>
            <v-col
              v-for="order in completedOrders"
              :key="order.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <kitchen-order-card
                :order="order"
              />
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </v-container>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="showError"
      color="error"
      timeout="3000"
    >
      {{ error }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showError = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useKitchenStore } from '@/stores/kitchen'
import { usePosStore } from '@/stores/pos-store'
import KitchenOrderCard from './components/KitchenOrderCard.vue'
import { logger } from '@/utils/logger'

// Store setup
const kitchenStore = useKitchenStore()
const posStore = usePosStore()
const { activeOrders, completedOrders, loading, error } = storeToRefs(kitchenStore)
const { holdInvoices } = storeToRefs(posStore)

// Local state
const activeTab = ref('active')
const showError = ref(false)
const refreshing = ref(false)
const autoRefresh = ref(true)
let pollInterval = null // Store interval reference
let refreshInterval = null

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    showError.value = true
  }
})

// Watch for changes in hold invoices
watch(holdInvoices, (newInvoices) => {
  if (newInvoices) {
    logger.debug('Updating kitchen orders from hold invoices:', newInvoices.length)
    kitchenStore.initializeOrders(newInvoices)
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
const handleOrderComplete = async (orderId) => {
  const success = await kitchenStore.completeOrder(orderId)
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
    logger.debug('Initializing kitchen display')
    await posStore.fetchHoldInvoices()
    kitchenStore.initializeOrders(posStore.holdInvoices || [])
    
    // Start polling for updates
    pollInterval = setInterval(async () => {
      await posStore.fetchHoldInvoices()
    }, 30000) // Poll every 30 seconds
    
    // Start auto-refresh if enabled
    if (autoRefresh.value) {
      startRefreshInterval()
    }
  } catch (err) {
    logger.error('Failed to initialize kitchen orders:', err)
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
.kitchen-display {
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
