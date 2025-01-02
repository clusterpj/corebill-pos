# src/views/kitchen/KitchenDisplay.vue
<template>
  <div class="kitchen-display">
    <v-container fluid class="pa-4">

      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">Kitchen Display</h1>
        <div class="d-flex align-center">
          <v-switch
            v-model="autoRefresh"
            label="Auto-refresh"
            density="compact"
            color="primary"
            class="mr-4"
          />
          <v-chip
            :color="kitchenOrders.length > 0 ? 'warning' : 'success'"
            size="large"
            class="orders-count"
          >
            {{ kitchenOrders.length }} Active Orders
          </v-chip>
        </div>
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
            v-if="kitchenOrders.length"
          >
            {{ kitchenOrders.length }}
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
      <v-window v-model="activeTab" class="flex-grow-1 overflow-y-auto">
        <!-- Active Orders -->
        <v-window-item value="active">
          <div v-if="loading" class="d-flex justify-center py-8">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            />
          </div>

          <div v-else-if="kitchenOrders.length === 0" class="text-center py-8">
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

          <v-row v-else class="overflow-y-auto">
            <v-col
              v-for="order in kitchenOrders"
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
          <v-row v-if="completedOrders.length">
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
          <div v-else class="text-center py-8">
            <v-icon
              icon="mdi-history"
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            />
            <h3 class="text-h6 text-grey-darken-1">No Order History</h3>
            <p class="text-body-1 text-medium-emphasis">
              Completed orders will appear here
            </p>
          </div>
        </v-window-item>
      </v-window>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { OrderType, OrderStatus } from '@/types/enums'
import { logger } from '@/utils/logger'
import KitchenOrderCard from './components/KitchenOrderCard.vue'
import { KitchenService } from '@/services/api/kitchen-service'

// Constants
const KITCHEN_SECTION_ID = 1
const POLL_INTERVAL = 30000

// Local state
const loading = ref(false)
const orders = ref([])
const activeTab = ref('active')
const autoRefresh = ref(true)
const refreshTimer = ref<NodeJS.Timeout | null>(null)

// Computed properties
const kitchenOrders = computed(() => {
  console.log('📊 Current orders:', orders.value)
  return orders.value.filter(order => {
    const hasKitchenItems = order.sections?.some(section => 
      section.section?.name === 'KITCHEN' ||
      section.name === 'KITCHEN'
    )
    const isProcessing = order.status === 'P'
    console.log(`🔍 Order ${order.id}:`, { hasKitchenItems, isProcessing })
    return hasKitchenItems && isProcessing
  })
})

const completedOrders = computed(() => {
  return orders.value.filter(order => {
    const hasKitchenItems = order.sections?.some(section => 
      section.section?.name === 'KITCHEN' ||
      section.name === 'KITCHEN'
    )
    return hasKitchenItems && order.status === 'C'
  })
})

async function fetchOrders() {
  loading.value = true
  try {
    const fetchedOrders = await KitchenService.fetchOrders(KITCHEN_SECTION_ID)
    orders.value = fetchedOrders
  } catch (error) {
    console.error('❌ [KitchenDisplay] Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

async function handleOrderComplete(orderId: number) {
  console.log('🎯 [KitchenDisplay] Completing order:', orderId)
  try {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return
    
    await KitchenService.updateOrderStatus([orderId], 'completed', order.type)
    await fetchOrders()
  } catch (error) {
    console.error('❌ [KitchenDisplay] Error completing order:', error)
  }
}

function startPolling() {
  console.log('🔄 [KitchenDisplay] Starting polling')
  stopPolling()
  refreshTimer.value = setInterval(fetchOrders, POLL_INTERVAL)
}

function stopPolling() {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

watch(autoRefresh, (enabled) => {
  enabled ? startPolling() : stopPolling()
})

onMounted(async () => {
  console.log('🚀 [KitchenDisplay] Component mounted')
  await fetchOrders()
  if (autoRefresh.value) startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.kitchen-display {
  height: 100vh;
  background-color: var(--v-background);
  display: flex;
  flex-direction: column;
}

.v-container {
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - 64px); /* Adjust for header height */
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
