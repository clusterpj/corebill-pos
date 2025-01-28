# src/components/kitchen/KitchenOrderCard.vue
<template>
  <v-card
    :class="[
      'order-card rounded-lg overflow-hidden',
      `order-card--${orderType}`,
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
            :color="order.invoice_number ? 'info' : 'warning'"
            class="mr-2"
          >
            {{ order.invoice_number ? 'Invoice' : 'Hold Order' }}
          </v-chip>
          <span class="text-h6 font-weight-medium">
            {{ order.invoice_number || `Hold #${order.id}` }}
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
              :class="[
                { 'item--with-note': item.description },
                { 'item--completed': item.pos_status === 'C' }
              ]"
            >
              <template v-slot:prepend>
                <v-chip
                  size="small"
                  :color="item.pos_status === 'C' ? 'success' : 'warning'"
                  variant="flat"
                  class="quantity-chip mr-2"
                >
                  {{ parseFloat(item.quantity) }}
                </v-chip>
              </template>

              <v-list-item-title class="d-flex justify-space-between align-center">
                <span :class="{ 'text-decoration-line-through': item.pos_status === 'C' }">
                  {{ item.name }}
                </span>
                <div class="d-flex align-center">
                  <v-btn
                    v-if="item.pos_status !== 'C'"
                    icon="mdi-check"
                    size="small"
                    color="success"
                    variant="text"
                    class="mr-2"
                    @click.stop="handleItemComplete(item.id)"
                  />
                </div>
              </v-list-item-title>

              <v-list-item-subtitle
                v-if="item.description"
                class="mt-1"
                :class="item.pos_status === 'C' ? 'text-success' : 'text-warning-darken-1'"
              >
                <v-icon
                  size="x-small"
                  :icon="item.pos_status === 'C' ? 'mdi-check-circle' : 'mdi-note-text'"
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
import { useKitchenStore } from '@/stores/kitchen'
import { formatPrice } from '@/utils/formatters'
import StatusIndicator from '@/components/StatusIndicator.vue'
import DateDisplay from '@/components/DateDisplay.vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['complete'])
const kitchenStore = useKitchenStore()
const loading = ref(false)

// Computed properties for order type handling
const isInvoice = computed(() => Boolean(props.order?.invoice_number))
const orderType = computed(() => isInvoice.value ? 'INVOICE' : 'HOLD')
const orderReference = computed(() => isInvoice.value ? props.order.invoice_number : `Hold #${props.order.id}`)

const kitchenItems = computed(() => {
  // Filter kitchen-specific items from order
  return props.order?.items?.filter(item => 
    item.section_type === 'kitchen'
  ) || [];
});

const isCompleted = computed(() => {
  if (!kitchenItems.value.length) return false
  
  // Check if all kitchen items are completed
  const allItemsCompleted = kitchenItems.value.every(item => item.pos_status === 'C')
  return allItemsCompleted
})

const handleComplete = async () => {
  try {
    loading.value = true
    const numericOrderId = Number(props.order.id)
    const orderType = props.order.invoice_number ? 'INVOICE' : 'HOLD'
    
    console.log('Completing order with details:', {
      orderId: numericOrderId,
      type: orderType,
      hasInvoiceNumber: Boolean(props.order.invoice_number),
      itemsCount: kitchenItems.value.length
    })
    
    if (!kitchenStore.orders.some(o => o.id === numericOrderId)) {
      throw new Error(`Order ${numericOrderId} not found in store`)
    }
    
    // Create payload with both order and items information
    const payload = {
      orderId: numericOrderId,
      type: orderType,
      pos_status: 'C',
      items: kitchenItems.value.map(item => ({
        id: Number(item.id),
        pos_status: 'C'
      }))
    }
    
    await kitchenStore.completeOrder(payload)
    emit('complete', numericOrderId)
  } catch (error) {
    console.error('Failed to complete order:', {
      orderId: props.order.id,
      type: props.order.invoice_number ? 'INVOICE' : 'HOLD',
      error
    })
  } finally {
    loading.value = false
  }
}


const handleItemComplete = async (itemId) => {
  loading.value = true
  const numericOrderId = Number(props.order.id)
  const numericItemId = Number(itemId)
  try {
    console.log(`Starting to complete item ${numericItemId} in order ${numericOrderId}`)
    if (!kitchenStore.orders.some(o => o.id === numericOrderId)) {
      throw new Error(`Order ${numericOrderId} not found in store`)
    }
    
    const payload = {
      orderId: numericOrderId,
      itemId: numericItemId,
      type: orderType.value,
      pos_status: 'C'
    }
    console.log('Completing item with payload:', payload)
    
    await kitchenStore.completeOrderItem(payload)
    // Check if all items are completed
    const allItemsCompleted = kitchenItems.value.every(item => item.pos_status === 'C')
    console.log(`All items completed status: ${allItemsCompleted}`)
    if (allItemsCompleted) {
      emit('complete', Number(props.order.id))
      console.log(`All items in order ${numericOrderId} are completed, emitted 'complete' event`)
    }
  } catch (error) {
    console.error(`Failed to complete item:`, {
      orderId: props.order.id,
      itemId,
      error: error.message
    })
  } finally {
    loading.value = false
    console.log(`Finished handling completion for item ${numericItemId} in order ${numericOrderId}`)
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

.item--completed {
  opacity: 0.75;
}

.items-list {
  max-height: 300px;
  overflow-y: auto;
}

.quantity-chip {
  min-width: 36px;
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
