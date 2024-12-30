<template>
  <v-chip
    :color="statusColor"
    :size="size"
    class="status-indicator"
    :class="{ 'completed': isCompleted }"
  >
    <v-icon
      v-if="showIcon"
      :size="size"
      :icon="statusIcon"
      start
      class="mr-1"
    />
    {{ formattedStatus }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrderStatus } from '@/types/enums'

const props = withDefaults(defineProps<{
  status: OrderStatus | string
  size?: 'x-small' | 'small' | 'default' | 'large'
  showIcon?: boolean
}>(), {
  size: 'small',
  showIcon: true
})

const isCompleted = computed(() => props.status === OrderStatus.COMPLETED)

const statusColor = computed(() => {
  switch (props.status) {
    case OrderStatus.COMPLETED:
      return 'success'
    case OrderStatus.IN_PROGRESS:
      return 'info'
    case OrderStatus.CANCELLED:
      return 'error'
    default:
      return 'warning'
  }
})

const statusIcon = computed(() => {
  switch (props.status) {
    case OrderStatus.COMPLETED:
      return 'mdi-check-circle'
    case OrderStatus.IN_PROGRESS:
      return 'mdi-progress-clock'
    case OrderStatus.CANCELLED:
      return 'mdi-cancel'
    default:
      return 'mdi-clock-alert'
  }
})

const formattedStatus = computed(() => {
  const statusMap = {
    [OrderStatus.PENDING]: 'Pending',
    [OrderStatus.IN_PROGRESS]: 'In Progress',
    [OrderStatus.COMPLETED]: 'Completed',
    [OrderStatus.CANCELLED]: 'Cancelled'
  }
  return statusMap[props.status as OrderStatus] || 'Unknown'
})
</script>

<style scoped>
.status-indicator {
  font-weight: 600 !important;
  letter-spacing: 0.5px;
}

.status-indicator.completed {
  opacity: 0.75;
}
</style>
