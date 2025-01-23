# src/components/kitchen/KitchenOrderCard.vue
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
        <!-- Order Type and Reference -->
        <div class="d-flex align-center">
          <v-chip
            size="small"
            :color="order.type === 'Invoice' ? 'info' : 'warning'"
            class="mr-2"
          >
            {{ order.displayType }}
          </v-chip>
          <span class="text-h6 font-weight-medium">
            {{ order.reference }}
          </span>
        </div>
        <status-indicator
          :status="order.status"
          size="small"
        />
      </div>
      
      <!-- Timestamps -->
      <div class="mt-2 d-flex justify-space-between align-center">
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
      <!-- Order Notes if any -->
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

      <!-- Kitchen Items -->
      <div class="items-list">
        <template v-if="kitchenItems.length">
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

              <v-list-item-title class="d-flex justify-space-between align-center">
                <span class="font-weight-medium">{{ item.name }}</span>
                <span class="text-caption text-medium-emphasis">
                  {{ formatPrice(item.price) }}
                </span>
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
          <p class="text-body-2 text-medium-emphasis">No kitchen items found</p>
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
  }
})

const emit = defineEmits(['complete'])

const loading = ref(false)
const isCompleted = computed(() => props.order.status === 'C')

const kitchenItems = computed(() => {
  console.log('Computing kitchen items for order:', props.order)
  
  if (!props.order.sections) {
    console.log('No sections found for order:', props.order.id)
    return []
  }
  
  // Find the kitchen section
  const kitchenSection = props.order.sections.find(section => {
    const sectionName = section.section?.name || section.name
    console.log('Checking section:', sectionName)
    return sectionName === 'KITCHEN'
  })
  
  if (!kitchenSection) {
    console.log('No kitchen section found for order:', props.order.id)
    return []
  }
  
  console.log('Found kitchen section:', kitchenSection)
  const items = kitchenSection.items || []
  console.log('Kitchen items:', items)
  
  return items
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price / 100) // Assuming price is in cents
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

:deep(.v-list-item-title) {
  font-size: 0.9rem !important;
}

:deep(.v-list-item-subtitle) {
  font-size: 0.8rem !important;
  white-space: normal !important;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>