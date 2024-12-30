<template>
  <div class="date-display d-flex align-center">
    <v-icon
      v-if="showIcon"
      :icon="icon"
      size="small"
      class="mr-1"
    />
    <time :datetime="timestamp" class="text-body-2 text-medium-emphasis">
      {{ formattedDate }}
    </time>
    <v-chip
      v-if="showElapsed && elapsedMinutes > threshold"
      size="x-small"
      :color="elapsedColor"
      class="ml-2"
    >
      {{ elapsedMinutes }}m
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  timestamp: string
  format?: 'time' | 'date' | 'datetime'
  showIcon?: boolean
  icon?: string
  showElapsed?: boolean
  threshold?: number
}>(), {
  format: 'time',
  showIcon: true,
  icon: 'mdi-clock-outline',
  showElapsed: false,
  threshold: 15
})

const formattedDate = computed(() => {
  const date = new Date(props.timestamp)
  switch (props.format) {
    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    case 'date':
      return date.toLocaleDateString()
    case 'datetime':
      return date.toLocaleString()
    default:
      return date.toLocaleTimeString()
  }
})

const elapsedMinutes = computed(() => {
  const start = new Date(props.timestamp)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
})

const elapsedColor = computed(() => {
  if (elapsedMinutes.value > props.threshold * 2) return 'error'
  if (elapsedMinutes.value > props.threshold) return 'warning'
  return 'info'
})
</script>
