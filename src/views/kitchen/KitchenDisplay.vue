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
import { storeToRefs } from 'pinia'
import { OrderType, OrderStatus } from '@/types/enums'
import { logger } from '@/utils/logger'
import KitchenOrderCard from './components/KitchenOrderCard.vue'
import { useSectionOrdersStore } from '@/stores/section-orders.store'

// Constants
const KITCHEN_SECTION_ID = 1
const POLL_INTERVAL = 30000 // 30 seconds

// Store setup
const sectionOrdersStore = useSectionOrdersStore()
const { loading } = storeToRefs(sectionOrdersStore)

// Local state
const activeTab = ref('active')
const autoRefresh = ref(true)
const refreshTimer = ref<NodeJS.Timeout | null>(null)

// Computed properties
const kitchenOrders = computed(() => {
  const orders = sectionOrdersStore.getOrdersBySection('kitchen')
  logger.debug('Kitchen Orders:', orders)
  return orders.filter(order => {
    const hasKitchenItems = order.items?.some(item => item.section_type === 'kitchen')
    logger.debug(`Order ${order.id} has kitchen items:`, hasKitchenItems)
    return hasKitchenItems
  })
})

const completedOrders = computed(() => {
  return kitchenOrders.value.filter(order => 
    order.status === OrderStatus.COMPLETED
  )
})

// Methods
async function handleOrderComplete(orderId: number) {
  try {
    // Only refresh the specific order that was completed
    const updatedOrder = await KitchenService.fetchOrdersDetails([orderId])
    if (updatedOrder.length > 0) {
      sectionOrdersStore.updateOrder(updatedOrder[0])
    }
  } catch (err) {
    logger.error('Failed to refresh order after completion:', err)
  }
}

function startPolling() {
  stopPolling()
  refreshTimer.value = setInterval(() => {
    if (autoRefresh.value) {
      sectionOrdersStore.debouncedFetch(KITCHEN_SECTION_ID)
    }
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Watch for auto-refresh changes
watch(autoRefresh, (enabled) => {
  if (enabled) {
    startPolling()
  } else {
    stopPolling()
  }
})

// Lifecycle hooks
onMounted(async () => {
  await sectionOrdersStore.fetchOrdersForSection(KITCHEN_SECTION_ID)
  if (autoRefresh.value) {
    startPolling()
  }
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
