# src/views/bar/components/BarOrderCard.vue
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
    <!-- Header -->
    <div class="order-header pa-4">
      <div class="d-flex justify-space-between align-center">
        <v-chip
          size="small"
          :color="order.type === 'HOLD' ? 'warning' : 'info'"
          class="mr-2"
        >
          {{ order.type === 'HOLD' ? 'Hold Order' : order.invoice_number }}
        </v-chip>
        <status-indicator
          :status="order.status"
          size="small"
        />
      </div>
      <div class="mt-2">
        <date-display
          :timestamp="order.invoice_date"
          format="time"
          show-elapsed
        />
      </div>
    </div>

    <!-- Items -->
    <v-divider></v-divider>
    <div class="order-content pa-4">
      <div v-if="order.description" class="order-notes mb-4">
        <v-alert
          color="info"
          variant="tonal"
          density="comfortable"
          class="mb-0"
        >
          <template v-slot:prepend>
            <v-icon size="small">mdi-note-text-outline</v-icon>
          </template>
          <div class="text-body-2">{{ order.description }}</div>
        </v-alert>
      </div>

      <!-- Bar Items -->
      <div class="items-list">
        <template v-if="barSection">
          <v-list density="compact">
            <v-list-item
              v-for="item in barSection.items"
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
        </template>
        <div v-else class="text-center py-4">
          <v-icon
            icon="mdi-alert"
            color="warning"
            size="24"
            class="mb-2"
          />
          <p class="text-body-2 text-medium-emphasis">No bar items found</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <v-divider v-if="!isCompleted"></v-divider>
    <div v-if="!isCompleted" class="order-actions pa-4">
      <v-btn
        block
        color="success"
        :loading="loading"
        @click="handleComplete"
        class="complete-btn"
        elevation="2"
      >
        <v-icon icon="mdi-check-circle" class="mr-2" />
        Mark as Complete
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import StatusIndicator from '@/components/common/StatusIndicator.vue'
import DateDisplay from '@/components/common/DateDisplay.vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['complete'])

const loading = ref(false)
const isCompleted = computed(() => props.completed || props.order.status === 'C')

const barSection = computed(() => {
  console.log('🔍 Finding bar section for order:', props.order)
  if (!props.order.sections) return null
  
  const section = props.order.sections.find(s => 
    (s.section?.name === 'BAR') || (s.name === 'BAR')
  )
  console.log('📋 Found bar section:', section)
  return section
})

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

.items-list {
  max-height: 300px;
  overflow-y: auto;
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

.order-header {
  background: linear-gradient(to right, var(--v-theme-surface), var(--v-theme-surface-variant));
}

@media (prefers-reduced-motion: reduce) {
  .order-card,
  .complete-btn {
    transition: none;
  }
}
</style>