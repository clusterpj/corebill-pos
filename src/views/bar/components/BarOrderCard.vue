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
        <status-indicator
          :status="order.status"
          size="small"
          class="ml-2"
        />
      </div>
      <date-display
        :timestamp="order.created_at"
        format="time"
        show-elapsed
      />
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
import { Order } from '@/types/order'
import { OrderStatus } from '@/types/enums'
import { PriceUtils } from '@/utils/price'
import DateDisplay from '@/components/common/DateDisplay.vue'
import StatusIndicator from '@/components/common/StatusIndicator.vue'

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
