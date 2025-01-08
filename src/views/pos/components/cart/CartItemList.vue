<!-- src/views/pos/components/cart/CartItemList.vue -->
<template>
  <div class="cart-items" :class="$attrs.class">
    <v-list class="cart-list pa-0" density="compact">
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
        class="cart-item py-1"
        :class="{ 'border-b': index !== items.length - 1 }"
      >
        <div class="d-flex align-center w-100 gap-2">
          <!-- Quantity Badge -->
          <div class="quantity-badge">
            {{ item.quantity }}
          </div>

          <!-- Item Info -->
          <div class="item-info flex-grow-1 min-width-0">
            <div class="item-name text-body-2 font-weight-medium text-truncate">
              {{ item.name }}
            </div>
            <div class="item-price text-caption text-grey-darken-1">
              {{ formatPrice(item.price) }} each
            </div>
          </div>

          <!-- Total and Actions -->
          <div class="d-flex align-center gap-1">
            <span class="item-total text-body-2 font-weight-medium">
              {{ formatPrice(item.price * item.quantity) }}
            </span>
            
            <div class="action-buttons d-flex">
              <v-btn
                icon="mdi-minus"
                size="small"
                variant="tonal"
                density="comfortable" 
                color="primary"
                :disabled="item.quantity <= 1"
                @click="handleQuantityUpdate(item.id, Math.max(0, item.quantity - 1), index)"
                class="touch-btn"
              />
              <v-btn
                icon="mdi-plus"
                size="small"
                variant="tonal"
                density="comfortable"
                color="primary"
                @click="handleQuantityUpdate(item.id, item.quantity + 1, index)"
                class="touch-btn"
              />
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="tonal"
                density="comfortable"
                color="primary"
                @click="handleModifyItem(item.id, index)"
                class="touch-btn"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="tonal"
                density="comfortable"
                color="error"
                @click="handleRemoveItem(item.id, index)"
                class="touch-btn"
              />
            </div>
          </div>
        </div>
      </v-list-item>
    </v-list>

    <!-- Modification Modal -->
    <ModificationModal
      v-if="modifyingItemId"
      :item-id="modifyingItemId"
      :item-name="modifyingItemName"
      :instance-ids="modifyingInstanceIds"
      :is-open="showModificationModal"
      @close="showModificationModal = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { logger } from '@/utils/logger'
import { PriceUtils } from '@/utils/price'
import ModificationModal from './ModificationModal.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['edit', 'remove', 'updateQuantity', 'modify'])

// Modification modal state
const showModificationModal = ref(false)
const modifyingItemId = ref(null)
const modifyingItemName = ref('')
const modifyingInstanceIds = ref([])

// Log initial cart state
console.log('CartItemList - Initial cart state:', {
  itemCount: props.items.length,
  items: props.items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: item.price * item.quantity
  }))
})

// Watch for cart changes
watch(() => props.items, (newItems, oldItems) => {
  console.log('CartItemList - Cart items changed:', {
    oldCount: oldItems?.length || 0,
    newCount: newItems.length,
    items: newItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      formatted_price: PriceUtils.format(item.price),
      quantity: item.quantity,
      total: item.price * item.quantity,
      formatted_total: PriceUtils.format(item.price * item.quantity)
    }))
  })
}, { deep: true })

// Format price for display
const formatPrice = (cents) => {
  console.log('CartItemList - Formatting price:', { 
    inputCents: cents,
    isDollarAmount: PriceUtils.isInDollars(cents)
  })

  return PriceUtils.format(cents)
}

// Computed total for all items
const cartTotal = computed(() => {
  const total = props.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity
    console.log('CartItemList - Calculating item total:', {
      itemId: item.id,
      price: item.price,
      quantity: item.quantity,
      itemTotal
    })
    return sum + itemTotal
  }, 0)
  
  console.log('CartItemList - Cart total calculated:', {
    itemCount: props.items.length,
    total,
    formattedTotal: PriceUtils.format(total)
  })
  return total
})

// Handlers with logging
const handleQuantityUpdate = (itemId, newQuantity, index) => {
  console.log('CartItemList - Updating quantity:', {
    itemId,
    index,
    oldQuantity: props.items[index].quantity,
    newQuantity,
    price: props.items[index].price,
    oldTotal: props.items[index].price * props.items[index].quantity,
    newTotal: props.items[index].price * newQuantity
  })
  emit('updateQuantity', itemId, newQuantity, index)
}

const handleRemoveItem = (itemId, index) => {
  console.log('CartItemList - Removing item:', {
    itemId,
    index,
    item: props.items[index]
  })
  emit('remove', itemId, index)
}

const handleEditItem = (itemId, index) => {
  console.log('CartItemList - Editing item:', {
    itemId,
    index,
    item: props.items[index]
  })
  emit('edit', itemId, index)
}

const handleModifyItem = (itemId, index) => {
  const item = props.items[index]
  console.log('CartItemList - Modifying item:', {
    itemId,
    index,
    item
  })
  
  // If this is a grouped item, split it into individual items
  if (item.quantity > 1) {
    // Remove the grouped item
    emit('remove', itemId, index)
    
    // Add individual items
    for (let i = 0; i < item.quantity; i++) {
      emit('add', {
        ...item,
        quantity: 1,
        instanceId: `${item.id}-${Date.now()}-${i}`
      })
    }
    
    // Get the new index of the first item
    index = props.items.findIndex(i => i.id === itemId)
  }
  
  // Ensure each item has a unique instance ID
  if (!item.instanceId) {
    item.instanceId = `${item.id}-${Date.now()}-${index}`
  }
  
  // Get all instance IDs for this item type
  const instanceIds = props.items
    .filter(i => i.id === itemId)
    .map(i => i.instanceId)
  
  // Ensure we have unique instance IDs
  const uniqueInstanceIds = [...new Set(instanceIds)]
  
  modifyingItemId.value = itemId
  modifyingItemName.value = item.name
  modifyingInstanceIds.value = uniqueInstanceIds
  showModificationModal.value = true
  emit('modify', itemId, index)
}
</script>

<style scoped>
.cart-items {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  position: relative;
}

.cart-list {
  background: transparent;
}

.cart-item {
  padding: 4px 4px;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.cart-item:hover {
  background-color: rgb(250, 250, 250);
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.quantity-badge {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  min-width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
}

.item-info {
  line-height: 1.2;
}

.item-name {
  margin-bottom: 2px;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

.min-width-0 {
  min-width: 0;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Touch Optimizations */
.touch-btn {
  margin: 0 2px;
  min-width: 36px !important;
  width: 36px;
  height: 36px !important;
}

.action-buttons {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.touch-btn:active {
  transform: scale(0.95);
}

/* Mobile Optimizations */
@media (max-width: 600px) {
  .cart-item {
    padding: 4px;
  }
  
  .quantity-badge {
    min-width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }
  
  .action-buttons {
    gap: 4px;
  }
}
</style>
