<template>
  <v-chip
    :color="statusColor"
    :size="size"
    variant="tonal"
    class="status-indicator"
  >
    <v-icon
      v-if="showIcon"
      :size="iconSize"
      :icon="statusIcon"
      class="mr-1"
    />
    {{ statusText }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
  size?: 'x-small' | 'small' | 'default' | 'large'
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  showIcon: true
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'x-small': return 12
    case 'small': return 16
    case 'large': return 24
    default: return 20
  }
})

const statusColor = computed(() => {
  switch (props.status?.toLowerCase()) {
    case 'p':
    case 'pending':
      return 'warning'
    case 'c':
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'grey'
  }
})

const statusIcon = computed(() => {
  switch (props.status?.toLowerCase()) {
    case 'p':
    case 'pending':
      return 'mdi-clock-outline'
    case 'c':
    case 'completed':
      return 'mdi-check-circle-outline'
    case 'cancelled':
      return 'mdi-close-circle-outline'
    default:
      return 'mdi-help-circle-outline'
  }
})

const statusText = computed(() => {
  switch (props.status?.toLowerCase()) {
    case 'p':
      return 'Pending'
    case 'c':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return props.status || 'Unknown'
  }
})
</script>

<style scoped>
.status-indicator {
  font-weight: 500;
}
</style>
