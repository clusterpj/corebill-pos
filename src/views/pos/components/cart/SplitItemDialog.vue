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
          @click="$emit('update:modelValue', false)"
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
            v => v < item?.quantity || 'Must be less than current quantity'
          ]"
          hide-details="auto"
          density="comfortable"
          class="mb-4"
        />
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="$emit('update:modelValue', false)"
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
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  item: Object
})

const emit = defineEmits(['update:modelValue', 'split'])

const splitQuantity = ref(1)

const isValidQuantity = computed(() => {
  if (!props.item?.quantity) return false
  const qty = Number(splitQuantity.value)
  return !isNaN(qty) && qty > 0 && qty < props.item.quantity
})

const handleSplit = () => {
  if (isValidQuantity.value) {
    emit('split', {
      itemId: props.item.id,
      quantity: Number(splitQuantity.value)
    })
    emit('update:modelValue', false)
    splitQuantity.value = 1
  }
}
</script>
