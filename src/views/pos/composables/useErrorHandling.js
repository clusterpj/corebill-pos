import { ref, watch } from 'vue'
import { logger } from '@/utils/logger'

export function useErrorHandling() {
  const error = ref(null)
  const loading = ref(false)

  const handleError = (err, context = '') => {
    const errorMessage = err.message || 'An unexpected error occurred'
    error.value = errorMessage
    logger.error(`Error in ${context}:`, err)
    return errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  // Auto-clear error when loading state changes
  watch(loading, (newValue) => {
    if (newValue) {
      clearError()
    }
  })

  return {
    error,
    loading,
    handleError,
    clearError
  }
}
