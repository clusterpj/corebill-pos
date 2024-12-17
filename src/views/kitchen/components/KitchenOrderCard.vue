<!-- src/views/kitchen/components/KitchenOrderCard.vue -->
<template>
  <v-card
    :class="[
      'order-card rounded-lg overflow-hidden',
      { 'order-card--completed': isCompleted }
    ]"
    :elevation="isCompleted ? 1 : 4"
  >
    <div class="p-4">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-semibold">Order #{{ order.id }}</h2>
        <v-chip
          :color="statusColor"
          size="small"
          class="rounded-full px-3"
        >
          {{ isCompleted ? 'Completed' : 'Pending' }}
        </v-chip>
      </div>

      <div class="text-sm text-gray-600 flex items-center mb-4">
        <v-icon size="small" icon="mdi-clock-outline" class="mr-1" />
        {{ formatTime(order.created_at) }}
        <template v-if="isCompleted && order.completed_at">
          <v-icon size="small" icon="mdi-check-circle" class="ml-2 mr-1" />
          Completed at: {{ formatTime(order.completed_at) }}
        </template>
      </div>

      <!-- Order Notes -->
      <div v-if="orderNotes" class="order-notes mb-4">
        <v-alert
          color="info"
          variant="tonal"
          density="comfortable"
          class="mb-0"
        >
          <template v-slot:prepend>
            <v-icon size="small">mdi-note-text-outline</v-icon>
          </template>
          <div class="text-body-2">{{ orderNotes }}</div>
        </v-alert>
      </div>

      <div class="space-y-4 max-h-48 overflow-y-auto">
        <template v-for="(item, index) in order.hold_items" :key="index">
          <div class="mb-3">
            <h3 class="font-semibold">
              {{ item.name }}
              <span v-if="item.quantity > 1" class="text-sm text-gray-600 ml-2">
                x{{ item.quantity }}
              </span>
            </h3>
            
            <div v-if="item.notes" class="text-sm text-gray-600 mt-1 italic">
              Note: {{ item.notes }}
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="!isCompleted" class="p-4 bg-gray-50">
      <v-btn
        block
        color="success"
        variant="elevated"
        :loading="loading"
        @click="$emit('complete', order.id)"
        class="text-none"
      >
        <v-icon icon="mdi-check-circle" class="mr-2" />
        Mark as Complete
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { parseOrderNotes } from '../../../stores/cart/helpers'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

defineEmits(['complete'])

const loading = ref(false)
const isCompleted = computed(() => 
  props.order.status === 'completed' || !!props.order.completed_at
)

const statusColor = computed(() => {
  if (isCompleted.value) return 'success'
  if (props.order.status === 'in_progress') return 'info'
  return 'warning'
})

const orderNotes = computed(() => {
  if (!props.order.notes) return null
  return parseOrderNotes(props.order.notes)
})

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.order-card {
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.order-card--completed {
  opacity: 0.75;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.max-h-48 {
  max-height: 12rem;
}

.overflow-y-auto {
  overflow-y: auto;
}

:deep(.v-btn) {
  text-transform: none !important;
  letter-spacing: normal !important;
}

:deep(.v-chip) {
  font-weight: 500 !important;
}

.order-notes :deep(.v-alert) {
  padding: 8px 16px;
}
</style>
