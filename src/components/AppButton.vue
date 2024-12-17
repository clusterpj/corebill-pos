<!-- src/components/AppButton.vue -->
<template>
  <v-btn
    :loading="loading"
    :disabled="disabled"
    :color="color"
    :variant="variant"
    :size="size"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </v-btn>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: 'primary'
  },
  variant: {
    type: String,
    default: 'filled'
  },
  size: {
    type: String,
    default: 'default'
  }
})

defineEmits(['click'])
</script>