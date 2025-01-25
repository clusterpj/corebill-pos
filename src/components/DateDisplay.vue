<template>
  <div class="date-display d-flex align-center">
    <v-icon
      v-if="showIcon"
      :icon="icon"
      :size="iconSize"
      :color="iconColor"
      class="mr-1"
    />
    <span :class="textClass">
      {{ displayText }}
      <span v-if="showElapsed" class="text-medium-emphasis">
        ({{ elapsedTime }})
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatElapsedTime } from '@/utils/formatters'

interface Props {
  timestamp: string | Date
  format?: 'full' | 'date' | 'time'
  showIcon?: boolean
  showElapsed?: boolean
  iconSize?: string | number
  iconColor?: string
  textClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  format: 'full',
  showIcon: true,
  showElapsed: false,
  iconSize: 'small',
  iconColor: 'grey-darken-1',
  textClass: 'text-body-2'
})

const icon = computed(() => {
  switch (props.format) {
    case 'time':
      return 'mdi-clock-outline'
    case 'date':
      return 'mdi-calendar-outline'
    default:
      return 'mdi-calendar-clock'
  }
})

const displayText = computed(() => {
  const date = typeof props.timestamp === 'string' 
    ? new Date(props.timestamp) 
    : props.timestamp

  const options: Intl.DateTimeFormatOptions = {
    hour12: true
  }

  switch (props.format) {
    case 'time':
      Object.assign(options, {
        hour: '2-digit',
        minute: '2-digit'
      })
      break
    case 'date':
      Object.assign(options, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      break
    default:
      Object.assign(options, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
  }

  return new Intl.DateTimeFormat('en-US', options).format(date)
})

const elapsedTime = computed(() => {
  return formatElapsedTime(props.timestamp)
})
</script>

<style scoped>
.date-display {
  white-space: nowrap;
}
</style>
