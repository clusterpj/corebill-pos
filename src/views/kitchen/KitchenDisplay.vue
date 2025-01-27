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
        class="mb-4 kitchen-tabs"
        fixed-tabs
        show-arrows
        height="56"
      >
        <v-tab
          value="active"
          class="kitchen-tab text-subtitle-1 font-weight-medium"
          :default="true"
        >
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
        <v-tab value="history" class="kitchen-tab text-subtitle-1">
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
        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          />
        </div>

        <template v-else>
          <!-- Active Orders Tab -->
          <v-window-item value="active">
            <div v-if="kitchenOrders.length === 0" class="text-center py-8">
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

          <!-- Order History Tab -->
          <v-window-item value="history">
            <div v-if="completedOrders.length === 0" class="text-center py-8">
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
                  :completed="true"
                />
              </v-col>
            </v-row>
          </v-window-item>
        </template>
      </v-window>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { KitchenService } from '@/services/api/kitchen-service'
import KitchenOrderCard from './components/KitchenOrderCard.vue'
import { useKitchenStore } from '@/stores/kitchen' // <-- Add this

// Constants
const KITCHEN_SECTION_ID = 1
const POLL_INTERVAL = 80000
// Local state
const loading = ref(false)
const orders = ref([])
const activeTab = ref('active') // Default to 'active' tab
const persistedTab = localStorage.getItem('kitchenActiveTab')
if (persistedTab) {
  activeTab.value = persistedTab
}
const autoRefresh = ref(true)
const refreshTimer = ref(null)

// Computed properties
const kitchenOrders = computed(() => {
  return orders.value
    .filter(order => {
      const hasKitchenItems = order.items?.some(item => 
        item.section_type === 'kitchen' && item.pos_status === 'P'
      )
      const isPending = order.pos_status === 'P'
      const isValidType = ['INVOICE', 'HOLD'].includes(order.type?.toUpperCase())
      
      return hasKitchenItems && isPending && isValidType
    })
    .sort((a, b) => {
      const dateA = new Date(a.invoice_date || a.created_at)
      const dateB = new Date(b.invoice_date || b.created_at)
      return dateB.getTime() - dateA.getTime()
    })
})

const completedOrders = computed(() => {
  return orders.value
    .filter(order => {
      const hasKitchenItems = order.items?.some(item => item.section_type === 'kitchen')
      const isCompleted = order.pos_status === 'C'
      const isValidType = ['INVOICE', 'HOLD'].includes(order.type?.toUpperCase())
      
      return hasKitchenItems && isCompleted && isValidType
    })
    .sort((a, b) => {
      const dateA = new Date(a.completed_at || a.invoice_date || a.created_at)
      const dateB = new Date(b.completed_at || b.invoice_date || b.created_at)
      return dateB - dateA
    })
})

async function fetchOrders() {
  loading.value = true
  try {
    const fetchedOrders = await KitchenService.fetchOrders(KITCHEN_SECTION_ID)
    console.log('📦 All fetched orders:', fetchedOrders)
    
    // Process and normalize orders
    orders.value = fetchedOrders.map(order => {
      console.log(`🔄 Processing order ${order.id}:`, order)
      return {
        ...order,
        items: Array.isArray(order.items) ? order.items : []
      }
    })
    
    console.log('💾 Processed orders:', orders.value)
    console.log('📊 Orders summary:', {
      total: orders.value.length,
      active: kitchenOrders.value.length,
      completed: completedOrders.value.length
    })
    console.log('📊 Updated orders:', {
      total: orders.value.length,
      active: kitchenOrders.value.length,
      completed: completedOrders.value.length
    })
  } catch (error) {
    console.error('❌ Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

async function handleOrderComplete(orderId) {
  console.log('🎯 Completing order:', orderId)
  try {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      console.error('❌ Order not found:', orderId)
      return
    }
    
    // Determine the correct API type based on the order type
    const apiType = order.type === 'Invoice' ? 'INVOICE' : 'HOLD'
    
    console.log('📤 Updating order status:', {
      orderId,
      type: order.type,
      apiType,
      originalOrder: order
    })
    
    await KitchenService.updateOrderStatus([orderId], 'completed', apiType)
    await fetchOrders()
  } catch (error) {
    console.error('❌ Error completing order:', error)
  }
}

function startPolling() {
  stopPolling()
  activeTab.value = 'active' // Reset to active tab
  refreshTimer.value = setInterval(() => {
    fetchOrders()
    activeTab.value = 'active' // Maintain active tab
  }, POLL_INTERVAL)
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

// Persist tab selection
watch(activeTab, (newTab) => {
  console.log('Tab changed to:', newTab)
})

const kitchenStore = useKitchenStore() // <-- Create store reference

onMounted(async () => {
  console.log('🚀 Component mounted')
  // Always set active tab first, before any other operations
  activeTab.value = 'active'
  
  await fetchOrders()
  
  if (orders.value.length) {
    kitchenStore.$patch({
      orders: orders.value,
      orderIds: orders.value.map(o => o.id)
    })
  }
  
  if (autoRefresh.value) {
    startPolling()
  }
  
  console.log('📊 Mount complete:', {
    activeTab: activeTab.value,
    activeOrders: kitchenOrders.value.length,
    completedOrders: completedOrders.value.length
  })
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
  height: calc(100vh - 64px);
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
