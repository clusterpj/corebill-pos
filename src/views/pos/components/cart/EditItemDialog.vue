<template>
  <v-dialog v-model="showDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        {{ item?.name }}
        <v-chip>Qty: {{ item?.quantity || 0 }}</v-chip>
      </v-card-title>

      <v-card-text>
        <!-- Split Item Option -->
        <div class="mb-4">
          <div class="text-subtitle-2 mb-2">Split Item</div>
          <div class="d-flex align-center gap-2">
            <v-text-field
              v-model="splitQuantity"
              type="number"
              label="Quantity to split"
              :min="1"
              :max="item?.quantity - 1"
              density="compact"
              hide-details
              style="max-width: 120px"
            />
            <v-btn
              color="primary"
              variant="outlined"
              :disabled="!canSplit"
              @click="handleSplit"
            >
              Split
            </v-btn>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="grey"
          variant="text"
          @click="close"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          @click="close"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '../../../../stores/cart-store'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  item: {
    type: Object,
    default: null
  },
  index: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const cartStore = useCartStore()
const splitQuantity = ref(1)

const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canSplit = computed(() => {
  return props.item &&
         splitQuantity.value > 0 &&
         splitQuantity.value < props.item.quantity
})

const handleSplit = () => {
  if (canSplit.value) {
    cartStore.splitItem(
      props.index,
      Number(splitQuantity.value)
    )
    close()
  }
}

const close = () => {
  showDialog.value = false
  splitQuantity.value = 1
}
</script>
