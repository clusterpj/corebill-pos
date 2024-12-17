<template>
  <v-dialog v-model="show" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-center">
        Select Order Type
      </v-card-title>

      <v-card-text>
        <!-- Error Alert -->
        <v-alert
          v-if="localError"
          type="error"
          class="mb-4"
          closable
          @click:close="localError = null"
        >
          {{ localError }}
        </v-alert>

        <v-row>
          <v-col cols="6" v-for="type in Object.values(ORDER_TYPES)" :key="type">
            <v-btn
              block
              :color="getButtonColor(type)"
              height="80"
              @click="selectOrderType(type)"
              :loading="loading && selectedType === type"
              :disabled="loading"
            >
              {{ formatOrderType(type) }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="grey"
          variant="text"
          :disabled="loading"
          @click="close"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOrderType } from '../../composables/useOrderType'
import { logger } from '../../../../utils/logger'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'type-selected'])

const { ORDER_TYPES, loading, error, setOrderType, processOrder } = useOrderType()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const localError = ref(null)
const selectedType = ref(null)

const getButtonColor = (type) => {
  switch (type) {
    case ORDER_TYPES.DINE_IN:
      return 'primary'
    case ORDER_TYPES.TO_GO:
      return 'success'
    case ORDER_TYPES.PICKUP:
      return 'warning'
    case ORDER_TYPES.DELIVERY:
      return 'info'
    default:
      return 'default'
  }
}

const formatOrderType = (type) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const selectOrderType = async (type) => {
  logger.startGroup('Order Type Selection')
  selectedType.value = type
  localError.value = null

  try {
    logger.info('Setting order type:', type)
    setOrderType(type)
    
    logger.info('Processing order')
    const result = await processOrder()
    
    if (result.success) {
      logger.info('Order type set successfully')
      emit('type-selected', type)
      close()
    } else {
      throw new Error(result.message || 'Failed to process order')
    }
  } catch (err) {
    logger.error('Failed to set order type:', err)
    localError.value = err.message || 'Failed to set order type'
    selectedType.value = null
  } finally {
    logger.endGroup()
  }
}

const close = () => {
  if (!loading.value) {
    show.value = false
    localError.value = null
    selectedType.value = null
  }
}
</script>
