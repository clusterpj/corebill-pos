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

        <!-- Modifications Section -->
        <div class="modifications-section">
          <div class="text-subtitle-2 mb-2">Modifications</div>
          
          <!-- Current Modifications -->
          <div v-if="item?.modifications?.length" class="mb-2">
            <v-chip
              v-for="(mod, index) in item.modifications"
              :key="index"
              class="me-1 mb-1"
              closable
              @click:close="removeModification(index)"
            >
              {{ mod }}
            </v-chip>
          </div>

          <!-- Add Modification -->
          <div class="d-flex align-center gap-2">
            <v-text-field
              v-model="newModification"
              label="Add modification"
              density="compact"
              hide-details
              @keyup.enter="addModification"
            />
            <v-btn
              color="primary"
              variant="outlined"
              :disabled="!newModification"
              @click="addModification"
            >
              Add
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
import { ref, computed, watch } from 'vue'
import { useCartStore } from '../../../../stores/cart-store'

const props = defineProps({
  modelValue: Boolean,
  item: Object,
  index: Number
})

const emit = defineEmits(['update:modelValue'])

const cartStore = useCartStore()
const splitQuantity = ref(1)
const newModification = ref('')

// Reset form when dialog opens
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    splitQuantity.value = 1
    newModification.value = ''
  }
})

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
    cartStore.splitItem(props.index, Number(splitQuantity.value))
    close()
  }
}

const addModification = () => {
  if (newModification.value) {
    cartStore.addModification(props.index, newModification.value)
    newModification.value = ''
  }
}

const removeModification = (modIndex) => {
  cartStore.removeModification(props.index, modIndex)
}

const close = () => {
  emit('update:modelValue', false)
  splitQuantity.value = 1
  newModification.value = ''
}
</script>

<style scoped>
.modifications-section {
  margin-top: 16px;
}
</style>
