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
import { logger } from '../../../../utils/logger'

const cartStore = useCartStore()
const { customerNotes, setCustomerNotes } = useOrderType()

const localNotes = ref('')

// Function to save notes to cart store
const saveNotesToCart = (notes) => {
  try {
    const notesObj = {
      customerNotes: notes,
      timestamp: new Date().toISOString()
    }
    cartStore.setNotes(JSON.stringify(notesObj))
    logger.debug('Notes saved to cart store:', { notes })
  } catch (error) {
    logger.error('Failed to save notes to cart:', error)
  }
}

// Function to update notes
const updateNotes = (value) => {
  setCustomerNotes(value)
  saveNotesToCart(value)
}

// Initialize notes from cart store
onMounted(() => {
  try {
    if (cartStore.notes) {
      const notes = parseOrderNotes(cartStore.notes)
      if (notes) {
        localNotes.value = notes
        setCustomerNotes(notes)
        logger.debug('Notes initialized from cart store:', { notes })
      }
    }
  } catch (error) {
    logger.error('Failed to initialize notes:', error)
  }
})

// Watch for external changes to customerNotes
watch(() => customerNotes.value, (newNotes) => {
  if (newNotes !== localNotes.value) {
    localNotes.value = newNotes
    saveNotesToCart(newNotes)
    logger.debug('Notes updated from customer notes:', { newNotes })
  }
})

// Watch for changes to cart store notes
watch(() => cartStore.notes, (newNotes) => {
  try {
    const notes = parseOrderNotes(newNotes)
    if (notes !== localNotes.value) {
      localNotes.value = notes
      logger.debug('Notes updated from cart store:', { notes })
    }
  } catch (error) {
    logger.error('Failed to parse cart store notes:', error)
  }
})
</script>

<style scoped>
.order-notes {
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
