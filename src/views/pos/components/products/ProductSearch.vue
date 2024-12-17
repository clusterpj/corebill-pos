<!-- src/views/pos/components/products/ProductSearch.vue -->
<template>
  <div class="search-wrapper">
    <v-fade-transition>
      <v-text-field
        v-model="searchQuery"
        :placeholder="isMobile ? 'Search...' : 'Search products...'"
        :label="isMobile ? null : 'Search Products'"
        density="comfortable"
        variant="outlined"
        hide-details
        class="search-field"
        bg-color="white"
        :class="{ 'is-mobile': isMobile }"
        :loading="isLoading"
        clearable
        @update:model-value="handleSearch"
        @click:clear="clearSearch"
        @keyup.enter="handleEnter"
      >
        <template v-slot:prepend-inner>
          <v-icon
            color="primary"
            :class="{ 'search-icon-animated': isLoading }"
          >
            mdi-magnify
          </v-icon>
        </template>
      </v-text-field>
    </v-fade-transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { logger } from '@/utils/logger'

const searchQuery = ref('')
const isLoading = ref(false)
const { mobile } = useDisplay()

const isMobile = computed(() => mobile.value)

const emit = defineEmits(['search', 'quickAdd'])

// Regular expressions for SKU patterns
const SKU_PATTERNS = {
  // Common SKU patterns - adjust these based on your actual SKU format
  NUMERIC: /^\d{4,}$/, // 4 or more digits
  ALPHANUMERIC: /^[A-Z]\d{3,}$/, // Letter followed by 3+ numbers
  DASHED: /^[A-Z0-9]+-[A-Z0-9]+$/, // Two alphanumeric parts with dash
}

// Debounced search with loading state
let searchTimeout
let skuBuffer = ''
let skuBufferTimeout

const isValidSKU = (value) => {
  // Early exit for short inputs
  if (!value || value.length < 4) return false
  
  // Convert to uppercase for consistent matching
  const upperValue = value.toUpperCase()
  
  // Check against each SKU pattern
  return Object.values(SKU_PATTERNS).some(pattern => pattern.test(upperValue))
}

const handleSearch = (value) => {
  if (!value) {
    clearSearch()
    return
  }

  isLoading.value = true
  clearTimeout(searchTimeout)
  clearTimeout(skuBufferTimeout)
  
  // Update SKU buffer
  skuBuffer = value
  
  // Check if input matches SKU pattern
  if (isValidSKU(value)) {
    logger.debug('Potential SKU detected:', { value })
    // For SKU-like input, give more time to complete typing
    skuBufferTimeout = setTimeout(() => {
      logger.info('Processing SKU:', { sku: skuBuffer })
      emit('quickAdd', skuBuffer)
      clearSearch()
    }, 1000) // Wait 1 second after last keystroke
  } else {
    // For regular search, use shorter debounce
    searchTimeout = setTimeout(() => {
      logger.debug('Processing search:', { query: value })
      emit('search', value)
      isLoading.value = false
    }, 300)
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  skuBuffer = ''
  clearTimeout(searchTimeout)
  clearTimeout(skuBufferTimeout)
  emit('search', '')
  isLoading.value = false
}

const handleEnter = () => {
  const value = searchQuery.value.trim()
  if (!value) return
  
  clearTimeout(skuBufferTimeout) // Clear any pending SKU timeout
  
  if (isValidSKU(value)) {
    logger.info('Manual SKU entry:', { sku: value })
    emit('quickAdd', value)
  } else {
    logger.info('Manual search entry:', { query: value })
    emit('search', value)
  }
  clearSearch()
}
</script>

<style scoped>
.search-wrapper {
  width: 100%;
  transition: all 0.3s ease;
}

.search-field {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-field:hover :deep(.v-field) {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.search-field :deep(.v-field) {
  transition: box-shadow 0.3s ease;
  border-radius: 12px;
}

.search-field :deep(.v-field__outline) {
  --v-field-border-width: 1.5px;
}

.search-field :deep(.v-field--focused) {
  box-shadow: 0 3px 12px rgba(0,0,0,0.12);
}

.search-field.is-mobile :deep(.v-field__input) {
  font-size: 14px;
  min-height: 44px;
}

.search-icon-animated {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Responsive Adjustments */
@media (max-width: 600px) {
  .search-wrapper {
    max-width: 100%;
  }
  
  .search-field :deep(.v-field) {
    border-radius: 8px;
  }
}
</style>
