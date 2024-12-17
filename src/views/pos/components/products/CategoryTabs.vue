<!-- src/views/pos/components/products/CategoryTabs.vue -->
<template>
  <div class="category-tabs-wrapper">
    <v-tabs
      v-model="selectedTab"
      density="comfortable"
      show-arrows
      slider-color="primary"
      selected-class="v-tab--selected"
      class="category-tabs"
      bg-color="white"
      @update:model-value="$emit('change', selectedTab)"
    >
        <v-tab
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
          class="category-tab"
          :ripple="false"
        >
          <v-icon
            v-if="category.icon"
            start
            :icon="category.icon"
            size="18"
            class="me-1"
          />
          {{ category.name }}
        </v-tab>
    </v-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  categories: {
    type: Array,
    required: true
  }
})

const selectedTab = ref('all')

defineEmits(['change'])
</script>

<style scoped>
.category-tabs-wrapper {
  position: relative;
}

.category-tabs {
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-tab {
  min-width: 100px;
  padding: 0 16px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  transition: all 0.2s ease;
}

.category-tab:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

:deep(.v-tab--selected) {
  color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.08);
  font-weight: 600;
}

:deep(.v-tabs__slider-wrapper) {
  height: 3px !important;
}

/* Mobile Optimizations */
@media (max-width: 600px) {
  .category-tab {
    min-width: 80px;
    padding: 0 12px;
    font-size: 0.875rem;
  }
  
  :deep(.v-btn__content) {
    gap: 4px;
  }
}
</style>
