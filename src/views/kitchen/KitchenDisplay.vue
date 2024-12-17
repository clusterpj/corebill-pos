<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Kitchen Display System</h1>
    
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="active" class="px-4 py-2">
        Active Orders
      </v-tab>
      <v-tab value="history" class="px-4 py-2">
        Order History
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="active">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <kitchen-order-card
            v-for="order in activeOrders"
            :key="order.id"
            :order="order"
            @complete="markOrderComplete"
          />
        </div>
        <div v-if="!activeOrders.length" class="text-center py-8">
          <p class="text-gray-600">No active orders</p>
        </div>
      </v-window-item>

      <v-window-item value="history">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <kitchen-order-card
            v-for="order in completedOrders"
            :key="order.id"
            :order="order"
          />
        </div>
        <div v-if="!completedOrders.length" class="text-center py-8">
          <p class="text-gray-600">No completed orders</p>
        </div>
      </v-window-item>
    </v-window>

    <!-- Loading State -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import KitchenOrderCard from './components/KitchenOrderCard.vue'
import { useKitchenOrders } from './composables/useKitchenOrders'

const activeTab = ref('active')
const { activeOrders, completedOrders, loading, markOrderComplete } = useKitchenOrders()
</script>

<style scoped>
.container {
  max-width: 1400px;
}

.grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

:deep(.v-tab) {
  text-transform: none !important;
  font-size: 1rem !important;
}

:deep(.v-tab--selected) {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}
</style>
