<template>
  <div class="order-notes px-4 py-2">
    <v-text-field
      v-model="localNotes"
      label="Order Notes"
      placeholder="Add notes for this order..."
      variant="outlined"
      density="comfortable"
      hide-details
      clearable
      @update:model-value="updateNotes"
    >
      <template v-slot:prepend-inner>
        <v-icon size="small" color="grey">mdi-note-text-outline</v-icon>
      </template>
    </v-text-field>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useOrderType } from '../../composables/useOrderType'
import { useCartStore } from '../../../../stores/cart-store'
import { parseOrderNotes } from '../../../../stores/cart/helpers'

const cartStore = useCartStore()
const { customerNotes, setCustomerNotes } = useOrderType()

const localNotes = ref('')

// Initialize notes from cart store
onMounted(() => {
  if (cartStore.notes) {
    const notes = parseOrderNotes(cartStore.notes)
    if (notes) {
      localNotes.value = notes
      setCustomerNotes(notes)
    }
  }
})

// Watch for external changes to customerNotes
watch(() => customerNotes.value, (newNotes) => {
  if (newNotes !== localNotes.value) {
    localNotes.value = newNotes
  }
}, { immediate: true })

// Watch for changes to cart store notes
watch(() => cartStore.notes, (newNotes) => {
  const notes = parseOrderNotes(newNotes)
  if (notes !== localNotes.value) {
    localNotes.value = notes
  }
}, { immediate: true })

const updateNotes = (value) => {
  setCustomerNotes(value)
}
</script>

<style scoped>
.order-notes {
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
