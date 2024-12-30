<template>
  <v-card
    :class="[
      'order-card rounded-lg overflow-hidden',
      `order-card--${order.status}`,
      { 'order-card--completed': isCompleted }
    ]"
    :elevation="isCompleted ? 1 : 4"
    :color="isCompleted ? 'grey-lighten-4' : undefined"
  >
    <!-- Header Section -->
    <div class="order-header pa-4" :class="{ 'completed': isCompleted }">
      <div class="d-flex justify-space-between align-center">
        <v-chip
          size="small"
          :color="getOrderTypeColor(order.type)"
          class="mr-2"
        >
          {{ formatOrderType(order.type) }}
        </v-chip>
        <div class="order-id">
          <h2 class="text-h6 font-weight-bold mb-0">
            {{ order.invoice_number || `Order #${order.id}` }}
          </h2>
          <div class="order-time d-flex align-center mt-1">
            <v-icon size="small" icon="mdi-clock-outline" class="mr-1" />
            <time :datetime="order.invoice_date" class="text-body-2 text-medium-emphasis">
              {{ formatTime(order.invoice_date) }}
            </time>
            <v-chip
              v-if="getElapsedTime(order.invoice_date) > 15"
              size="x-small"
              color="error"
              class="ml-2"
            >
              {{ getElapsedTime(order.invoice_date) }}m
            </v-chip>
          </div>
        </div>
        
        <v-chip
          :color="statusColor"
          size="small"
          class="status-chip"
          :class="{ 'completed': isCompleted }"
        >
          <v-icon size="small" :icon="statusIcon" start class="mr-1" />
          {{ formatStatus(order.status) }}
        </v-chip>
      </div>
    </div>

    <!-- Order Content -->
    <v-divider></v-divider>
    
    <div class="order-content pa-4">
      <!-- Order Notes -->
      <div v-if="order.description" class="order-notes mb-4">
        <v-alert
          color="info"
          variant="tonal"
          density="comfortable"
          class="mb-0"
          role="alert"
        >
          <template v-slot:prepend>
            <v-icon size="small">mdi-note-text-outline</v-icon>
          </template>
          <div class="text-body-2">{{ order.description }}</div>
        </v-alert>
      </div>

      <!-- Items List -->
      <div class="items-list">
        <v-list density="compact">
          <v-list-item
            v-for="item in kitchenItems"
            :key="item.id"
            :class="{ 'item--with-note': item.description }"
          >
            <template v-slot:prepend>
              <v-chip
                size="small"
                color="primary"
                variant="flat"
                class="quantity-chip mr-2"
              >
                {{ parseFloat(item.quantity) }}
              </v-chip>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ item.name }}
            </v-list-item-title>

            <v-list-item-subtitle
              v-if="item.description"
              class="mt-1 text-warning-darken-1"
            >
              <v-icon
                size="x-small"
                icon="mdi-note-text"
                class="mr-1"
              />
              {{ item.description }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
    </div>

    <!-- Action Footer -->
    <v-divider v-if="!isCompleted"></v-divider>
    
    <div v-if="!isCompleted" class="order-actions pa-4">
      <v-btn
        block
        color="success"
        variant="elevated"
        :loading="loading"
        @click="handleComplete"
        class="complete-btn"
        :disabled="loading"
        elevation="2"
      >
        <v-icon icon="mdi-check-circle" class="mr-2" />
        Mark as Complete
      </v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { OrderStatus } from '@/types/enums'
import type { SectionOrder } from '@/services/section-order.service'
import { formatCurrency } from '@/utils/currency'
import { 
  formatTime, 
  getElapsedTime, 
  getOrderTypeColor, 
  formatOrderType 
} from '../utils/formatters'

const props = defineProps<{
  order: SectionOrder
}>()

const emit = defineEmits<{
  (e: 'complete', id: number): void
}>()

const loading = ref(false)
const isCompleted = computed(() => props.order.status === OrderStatus.COMPLETED)

const statusColor = computed(() => {
  if (isCompleted.value) return 'success'
  if (props.order.status === OrderStatus.IN_PROGRESS) return 'info'
  return 'warning'
})

const statusIcon = computed(() => {
  if (isCompleted.value) return 'mdi-check-circle'
  if (props.order.status === OrderStatus.IN_PROGRESS) return 'mdi-progress-clock'
  return 'mdi-clock-alert'
})

const kitchenItems = computed(() => 
  props.order.items?.filter(item => item.section_type === 'kitchen') || []
)

import { 
  formatTime, 
  getElapsedTime, 
  getOrderTypeColor, 
  formatOrderType 
} from '../utils/formatters'

const formatStatus = (status: OrderStatus | undefined) => {
  if (!status) return 'Pending'
  
  const statusMap = {
    [OrderStatus.PENDING]: 'Pending',
    [OrderStatus.IN_PROGRESS]: 'In Progress',
    [OrderStatus.COMPLETED]: 'Completed',
    [OrderStatus.CANCELLED]: 'Cancelled'
  }
  
  return statusMap[status] || 'Unknown'
}

const handleComplete = async () => {
  if (loading.value || isCompleted.value) return
  
  loading.value = true
  try {
    await emit('complete', props.order.id)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.order-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 2px solid transparent;
}

.order-card--completed {
  opacity: 0.85;
}

.order-card:not(.order-card--completed):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
}

.order-header {
  background: linear-gradient(to right, var(--v-theme-surface), var(--v-theme-surface-variant));
  transition: background-color 0.3s ease;
}

.order-header.completed {
  background: var(--v-theme-surface-variant);
}

.status-chip {
  font-weight: 600 !important;
  letter-spacing: 0.5px;
}

.status-chip.completed {
  opacity: 0.75;
}

.items-list {
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.items-list::-webkit-scrollbar {
  width: 6px;
}

.items-list::-webkit-scrollbar-track {
  background: var(--v-theme-surface);
}

.items-list::-webkit-scrollbar-thumb {
  background-color: var(--v-theme-surface-variant);
  border-radius: 3px;
}

.quantity-chip {
  min-width: 32px;
  justify-content: center;
}

.item--with-note {
  padding-bottom: 8px;
}

.complete-btn {
  transition: transform 0.2s ease;
}

.complete-btn:hover:not(:disabled) {
  transform: scale(1.02);
}

.order-notes :deep(.v-alert) {
  padding: 8px 16px;
}

/* Status-specific styles */
.order-card--pending {
  border-color: var(--v-theme-warning);
}

.order-card--in_progress {
  border-color: var(--v-theme-info);
}

.order-card--completed {
  border-color: var(--v-theme-success);
}

@media (prefers-reduced-motion: reduce) {
  .order-card,
  .complete-btn {
    transition: none;
  }
}
</style>
