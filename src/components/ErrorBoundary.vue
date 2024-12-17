<!-- src/components/ErrorBoundary.vue -->
<template>
  <div v-if="error">
    <v-alert
      type="error"
      title="Something went wrong"
      :text="errorMessage"
      class="mb-4"
    ></v-alert>
    <v-btn @click="resetError" color="primary">
      Try Again
    </v-btn>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, computed, onErrorCaptured } from 'vue' // Added all required imports
import { logger } from '@/utils/logger'

const error = ref(null)
const errorMessage = computed(() => {
  if (import.meta.env.DEV) {
    return error.value?.stack
  }
  return 'An unexpected error occurred. Please try again later.'
})

onErrorCaptured((err, instance, info) => {
  error.value = err
  logger.error('Error captured by boundary:', {
    error: err,
    componentInstance: instance,
    info: info
  })
  return false
})

const resetError = () => {
  error.value = null
}
</script>