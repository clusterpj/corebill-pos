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
            <div class="d-flex align-center">
              <div class="item-price text-caption text-grey-darken-1">
                {{ formatPrice(item.price) }} each
              </div>
              <v-chip
                v-if="item.description"
                size="x-small"
                color="info"
                class="ml-2"
                variant="tonal"
              >
                Note
              </v-chip>
            </div>
            <div v-if="item.description" class="text-caption text-grey-darken-2 mt-1 item-note">
              {{ item.description }}
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
                color="info"
                @click="handleEditNote(item, index)"
                class="touch-btn"
                :title="item.description ? 'Edit note' : 'Add note'"
              >
                <v-badge
                  :content="'1'"
                  :value="!!item.description"
                  color="primary"
                  offset-x="2"
                  offset-y="2"
                />
              </v-btn>
              <v-btn
                v-if="item.quantity > 1"
                icon="mdi-content-cut"
                size="small"
                variant="tonal"
                density="comfortable"
                color="warning"
                @click="handleSplitItem(item, index)"
                class="touch-btn"
                :title="'Split item'"
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

    <!-- Note Dialog -->
    <item-note-dialog
      v-model="showNoteDialog"
      :item="editingItem"
      @save="saveItemNote"
    />
    <!-- Split Item Dialog -->
    <split-item-dialog
      v-model="showSplitDialog"
      :item="editingItem"
      :index="editingIndex"
      @confirm="handleSplitConfirm"
    />
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { logger } from '@/utils/logger'
import { PriceUtils } from '@/utils/price'
import ItemNoteDialog from './ItemNoteDialog.vue'
import SplitItemDialog from './SplitItemDialog.vue'
import { useCartStore } from '@/stores/cart-store'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['edit', 'remove', 'update-quantity'])

// Log initial cart state
console.log('CartItemList - Initial cart state:', {
  itemCount: props.items.length,
  items: props.items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: item.price * item.quantity,
    description: item.description
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
      formatted_total: PriceUtils.format(item.price * item.quantity)[Symbol],
      description: item.description
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

// Dialog controls
const showNoteDialog = ref(false)
const showSplitDialog = ref(false)
const editingItem = ref(null)
const editingIndex = ref(null)

const cartStore = useCartStore()

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
  emit('update-quantity', itemId, newQuantity, index)
}

const handleRemoveItem = (itemId, index) => {
  console.log('CartItemList - Removing item:', {
    itemId,
    index,
    item: props.items[index]
  })
  emit('remove', itemId, index)
}

const handleEditNote = (item, index) => {
  console.log('Opening note dialog:', {
    item: {
      id: item.id,
      name: item.name,
      description: item.description
    },
    index
  })
  editingItem.value = { ...item } // Create a copy of the item
  editingIndex.value = index
  showNoteDialog.value = true
}

const saveItemNote = (note) => {
  if (editingItem.value && typeof editingIndex.value === 'number') {
    cartStore.updateItemNote(editingItem.value.id, note, editingIndex.value)
  }
}

// Split item handling
const handleSplitItem = (item, index) => {
  logger.info('Opening split dialog for item:', {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    index
  })
  editingItem.value = item
  editingIndex.value = index
  showSplitDialog.value = true
}

const handleSplitConfirm = (splitQuantity, note) => {
  if (editingItem.value === null || editingIndex.value === null) {
    logger.error('Split confirmation failed: No item being edited')
    return
  }
  
  logger.info('Splitting item:', {
    id: editingItem.value.id,
    name: editingItem.value.name,
    originalQuantity: editingItem.value.quantity,
    splitQuantity,
    note
  })
  
  // First split the item
  cartStore.splitItem(editingIndex.value, splitQuantity)
  
  // Then add the note to the new split item
  if (note) {
    // The new item is inserted after the original, so we use index + 1
    cartStore.updateItemNote(editingItem.value.id, note, editingIndex.value + 1)
  }
  
  showSplitDialog.value = false
  editingItem.value = null
  editingIndex.value = null
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

.item-note {
  white-space: pre-line;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Touch Optimizations */
.touch-btn {
  margin: 0 2px;
  min-width: 36px !important;
  width: 36px;
  height: 36px !important;
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
