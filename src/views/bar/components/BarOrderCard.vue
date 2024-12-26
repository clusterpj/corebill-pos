<template>
  <v-card 
    :class="[
      'bar-order-card', 
      { 'completed': completed }
    ]"
    elevation="2"
  >
    <v-card-title class="d-flex justify-space-between align-center pa-4">
      <div>
        <span class="text-h6">Order #{{ order.id }}</span>
        <v-chip 
          :color="getOrderStatusColor(order.status)"
          size="small" 
          class="ml-2"
        >
          {{ formatOrderStatus(order.status) }}
        </v-chip>
      </div>
      <div class="text-subtitle-2 text-medium-emphasis">
        {{ formatOrderTime(order.created_at) }}
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="pa-4">
      <div 
        v-for="(item, index) in barItems" 
        :key="index" 
        class="d-flex justify-space-between align-center mb-2"
      >
        <div>
          <span class="font-weight-medium">{{ item.name }}</span>
          <span class="text-caption text-medium-emphasis ml-2">
            × {{ item.quantity }}
          </span>
        </div>
        <span class="text-primary">
          {{ formatPrice(item.price * item.quantity) }}
        </span>
      </div>
    </v-card-text>

    <v-card-actions class="pa-4 pt-0">
      <v-spacer></v-spacer>
      <v-btn 
        v-if="!completed"
        color="success" 
        variant="elevated"
        @click="completeOrder"
      >
        Complete Order
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Order, OrderStatus } from '@/types/order'
import { PriceUtils } from '@/utils/price'

// Props
const props = defineProps({
  order: {
    type: Object as () => Order,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['complete'])

// Computed Properties
const barItems = computed(() => 
  props.order.items.filter(item => item.section_type === 'bar')
)

// Utility Functions
const formatPrice = (cents: number) => PriceUtils.format(cents)

const formatOrderTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getOrderStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return 'warning'
    case OrderStatus.IN_PROGRESS: return 'primary'
    case OrderStatus.COMPLETED: return 'success'
    default: return 'grey'
  }
}

const formatOrderStatus = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return 'Pending'
    case OrderStatus.IN_PROGRESS: return 'In Progress'
    case OrderStatus.COMPLETED: return 'Completed'
    default: return 'Unknown'
  }
}

// Methods
const completeOrder = () => {
  if (!props.completed) {
    emit('complete', props.order.id)
  }
}
</script>

<style scoped>
.bar-order-card {
  transition: all 0.3s ease;
  opacity: 1;
}

.bar-order-card.completed {
  opacity: 0.6;
}

.bar-order-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
</style>
