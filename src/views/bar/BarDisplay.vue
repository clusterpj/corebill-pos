<template>
  <div class="bar-display">
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">Bar Display</h1>
        <div class="d-flex align-center">
          <v-switch
            v-model="autoRefresh"
            label="Auto-refresh"
            density="compact"
            color="primary"
            class="mr-4"
          />
          <v-chip
            :color="barOrders.length > 0 ? 'warning' : 'success'"
            size="large"
            class="orders-count"
          >
            {{ barOrders.length }} Active Orders
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
          <v-icon icon="mdi-glass-cocktail" class="mr-2" />
          Active Orders
          <v-chip
            size="x-small"
            color="warning"
            class="ml-2"
            v-if="barOrders.length"
          >
            {{ barOrders.length }}
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

          <div v-else-if="barOrders.length === 0" class="text-center py-8">
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

          <v-row v-else class="overflow-y-auto">
            <v-col
              v-for="order in barOrders"
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
              v-for="order in completedOrders"
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
import { BarService } from '@/services/api/bar-service'
import BarOrderCard from './components/BarOrderCard.vue'

// Constants
const BAR_SECTION_ID = 2
const POLL_INTERVAL = 30000

// Local state
const loading = ref(false)
const orders = ref([])
const activeTab = ref('active')
const autoRefresh = ref(true)
const refreshTimer = ref<NodeJS.Timeout | null>(null)

// Computed properties
const barOrders = computed(() => {
  console.log('Computing bar orders from:', orders.value)
  return orders.value.filter(order => {
    console.log('Checking order:', order)
    
    const hasBarItems = order.sections?.some(section => {
      const isBarSection = section.section?.name === 'BAR' || section.name === 'BAR'
      const hasItems = section.items?.length > 0
      console.log(`Section check for order ${order.id}:`, { isBarSection, hasItems })
      return isBarSection && hasItems
    })
    
    const isProcessing = order.status === 'P'
    console.log(`🔍 Order ${order.id}:`, { 
      hasBarItems, 
      isProcessing, 
      sections: order.sections,
      status: order.status 
    })
    
    return hasBarItems && isProcessing
  })
})

const completedOrders = computed(() => {
  console.log('Computing completed orders from:', orders.value)
  return orders.value.filter(order => {
    console.log('Checking completed order:', order)
    
    const hasBarItems = order.sections?.some(section => {
      const isBarSection = section.section?.name === 'BAR' || section.name === 'BAR'
      const hasItems = section.items?.length > 0
      console.log(`Section check for completed order ${order.id}:`, { isBarSection, hasItems })
      return isBarSection && hasItems
    })
    
    const isCompleted = order.status === 'C'
    console.log(`🔍 Completed Order ${order.id}:`, { 
      hasBarItems, 
      isCompleted, 
      sections: order.sections,
      status: order.status 
    })
    
    return hasBarItems && isCompleted
  })
})

// Methods
async function fetchOrders() {
  loading.value = true
  try {
    const fetchedOrders = await BarService.fetchOrders(BAR_SECTION_ID)
    orders.value = fetchedOrders
  } catch (error) {
    console.error('❌ [BarDisplay] Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

async function handleOrderComplete(orderId: number) {
  console.log('🎯 [BarDisplay] Completing order:', orderId)
  try {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return
    
    await BarService.updateOrderStatus([orderId], 'completed', order.type)
    await fetchOrders()
  } catch (error) {
    console.error('❌ [BarDisplay] Error completing order:', error)
  }
}

function startPolling() {
  console.log('🔄 [BarDisplay] Starting polling')
  stopPolling()
  refreshTimer.value = setInterval(fetchOrders, POLL_INTERVAL)
}

function stopPolling() {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Watchers
watch(autoRefresh, (enabled) => {
  enabled ? startPolling() : stopPolling()
})

// Lifecycle
onMounted(async () => {
  console.log('🚀 [BarDisplay] Component mounted')
  await fetchOrders()
  if (autoRefresh.value) startPolling()
})

onUnmounted(() => {
  stopPolling()
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
