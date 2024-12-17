<!-- src/components/LoadingState.vue -->
<template>
    <div :class="containerClass">
      <v-progress-circular
        :size="size"
        :width="width"
        indeterminate
        color="primary"
      ></v-progress-circular>
      <span v-if="text" class="mt-2">{{ text }}</span>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    fullPage: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: 'Loading...'
    },
    size: {
      type: Number,
      default: 32
    },
    width: {
      type: Number,
      default: 4
    }
  })
  
  const containerClass = computed(() => ({
    'loading-container': true,
    'loading-container--full-page': props.fullPage
  }))
  </script>
  
  <style scoped>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  
  .loading-container--full-page {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  }
  </style>