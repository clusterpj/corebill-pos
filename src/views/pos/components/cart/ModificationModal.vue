<template>
  <v-dialog
    :model-value="isOpen"
    @update:model-value="(value) => $emit('update:isOpen', value)"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Modify Item</span>
        <v-btn
          icon="mdi-close"
          @click="closeModal"
        />
      </v-card-title>

      <v-card-text>
        <v-tabs v-model="activeTab">
          <v-tab
            v-for="(instanceId, index) in instanceIds"
            :key="instanceId"
            :value="instanceId"
          >
            Item {{ index + 1 }}
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <v-window-item
            v-for="instanceId in instanceIds"
            :key="instanceId"
            :value="instanceId"
          >
            <v-form @submit.prevent="saveModifications(instanceId)">
              <!-- Modifications Section -->
              <div v-if="availableModifications.length > 0">
                <v-card
                  v-for="mod in availableModifications"
                  :key="mod.id"
                  class="mb-4"
                  variant="outlined"
                >
                  <v-card-title class="text-subtitle-1">
                    {{ mod.name }}
                  </v-card-title>
                  <v-card-text>
                    <v-radio-group
                      v-model="selectedOptions[mod.id]"
                      hide-details
                    >
                      <v-radio
                        v-for="option in mod.options"
                        :key="option.id"
                        :label="`${option.name} (${formatPrice(option.priceAdjustment)})`"
                        :value="option.id"
                      />
                    </v-radio-group>
                  </v-card-text>
                </v-card>
              </div>

              <!-- Notes Section -->
              <v-textarea
                v-model="notes"
                label="Special Instructions"
                rows="2"
                auto-grow
                hide-details
                class="mb-4"
              />

              <v-divider class="my-4" />

              <!-- Price Summary -->
              <div class="d-flex justify-space-between">
                <span class="text-body-1">Base Price:</span>
                <span class="text-body-1 font-weight-medium">
                  {{ formatPrice(basePrice) }}
                </span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-body-1">Modifications:</span>
                <span class="text-body-1 font-weight-medium">
                  {{ formatPrice(modificationTotal) }}
                </span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between">
                <span class="text-body-1">Total Price:</span>
                <span class="text-body-1 font-weight-medium">
                  {{ formatPrice(totalPrice) }}
                </span>
              </div>
            </v-form>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="error"
          variant="text"
          @click="closeModal"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          @click="saveModifications"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { PriceUtils } from '@/utils/price'
import { useCartStore } from '@/stores/cart-store'

const props = defineProps({
  itemId: {
    type: Number,
    required: true
  },
  instanceIds: {
    type: Array,
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:isOpen', 'close'])

const cartStore = useCartStore()

// Track active tab
const activeTab = ref(props.instanceIds[0])

// Get all items for this product type
const items = computed(() => 
  props.instanceIds.map(instanceId => 
    cartStore.items.find(i => i.instanceId === instanceId)
  )
)

// Get modifications for current tab
const currentItem = computed(() =>
  items.value.find(i => i.instanceId === activeTab.value)
)

// Available modifications (this would come from your product data)
const availableModifications = computed(() => [
  {
    id: 1,
    name: 'Cheese',
    options: [
      { id: 1, name: 'Regular', priceAdjustment: 0 },
      { id: 2, name: 'Extra', priceAdjustment: 100 },
      { id: 3, name: 'None', priceAdjustment: 0 }
    ]
  },
  {
    id: 2,
    name: 'Toppings',
    options: [
      { id: 1, name: 'Regular', priceAdjustment: 0 },
      { id: 2, name: 'Extra', priceAdjustment: 50 },
      { id: 3, name: 'None', priceAdjustment: -50 }
    ]
  }
])

// Selected options for each modification
const selectedOptions = ref({})
const notes = ref('')

// Price calculations
const basePrice = computed(() => item.value?.price || 0)
const modificationTotal = computed(() => {
  return availableModifications.value.reduce((total, mod) => {
    const selectedOption = mod.options.find(
      opt => opt.id === selectedOptions.value[mod.id]
    )
    return total + (selectedOption?.priceAdjustment || 0)
  }, 0)
})
const totalPrice = computed(() => basePrice.value + modificationTotal.value)

// Format price helper
const formatPrice = (cents) => PriceUtils.format(cents)

// Initialize form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Initialize selected options from existing modifications
    if (item.value?.modifications) {
      item.value.modifications.forEach(mod => {
        const selected = mod.options.find(opt => opt.selected)
        if (selected) {
          selectedOptions.value[mod.id] = selected.id
        }
      })
    }
    // Initialize notes
    notes.value = item.value?.notes || ''
  }
})

// Save modifications to store
const saveModifications = (instanceId) => {
  const modifications = availableModifications.value.map(mod => ({
    id: mod.id,
    name: mod.name,
    options: mod.options.map(opt => ({
      ...opt,
      selected: opt.id === selectedOptions.value[mod.id]
    }))
  }))

  cartStore.modifyItem({
    instanceId,
    modifications,
    notes: notes.value
  })
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.v-card-title {
  padding: 16px;
}

.v-card-text {
  padding: 16px;
}

.v-card-actions {
  padding: 8px 16px;
}
</style>
