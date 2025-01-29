<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="400"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <span>Split Item</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="handleCancel"
        />
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="mb-4">
          <div class="text-subtitle-1 font-weight-medium mb-1">{{ item?.name }}</div>
          <div class="text-body-2 text-grey-darken-1">
            Current Quantity: {{ item?.quantity }}
          </div>
        </div>

        <v-text-field
          v-model="splitQuantity"
          label="Quantity to Split"
          type="number"
          :rules="[
            v => !!v || 'Quantity is required',
            v => v > 0 || 'Must be greater than 0',
            v => v < (props.item?.quantity || 0) || 'Must be less than current quantity'
          ]"
          hide-details="auto"
          density="comfortable"
          class="mb-4"
        />

        <v-textarea
          v-model="note"
          label="Note for Split Item"
          placeholder="Add special instructions for the split item..."
          rows="3"
          auto-grow
          density="comfortable"
          hide-details="auto"
          class="mb-4"
        />
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
          class="text-none"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          @click="handleSplit"
          :disabled="!isValidQuantity"
          class="text-none"
        >
          Split Item
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { logger } from '@/utils/logger'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  item: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const splitQuantity = ref(1)
const note = ref('')

// Reset form when dialog opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    splitQuantity.value = 1
    note.value = ''
  }
})

const isValidQuantity = computed(() => {
  if (!props.item?.quantity) return false
  const qty = Number(splitQuantity.value)
  return !isNaN(qty) && qty > 0 && qty < props.item.quantity
})

const handleCancel = () => {
  emit('update:modelValue', false)
  splitQuantity.value = 1
  note.value = ''
}

const handleSplit = () => {
  if (!isValidQuantity.value) {
    logger.warn('Invalid split quantity:', {
      quantity: splitQuantity.value,
      itemQuantity: props.item?.quantity
    })
    return
  }

  logger.info('Confirming split:', {
    itemId: props.item.id,
    quantity: Number(splitQuantity.value),
    note: note.value,
    index: props.index
  })
  
  emit('confirm', Number(splitQuantity.value), note.value)
  handleCancel()
}
</script>
