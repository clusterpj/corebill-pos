<!-- src/views/pos/components/held-orders/components/HeldOrdersFilters.vue -->
<template>
  <v-row dense>
    <template v-if="mode === 'active'">
      <!-- Only Type Filter for DINE IN/TOGO -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 4">
        <v-select
          :model-value="selectedType"
          @update:model-value="$emit('update:selectedType', $event)"
          :items="orderTypes"
          label="Filter by type"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-filter"
        ></v-select>
      </v-col>
    </template>

    <template v-else-if="mode === 'delivery'">
      <!-- Search Field -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 3">
        <v-text-field
          :model-value="search"
          @update:model-value="$emit('update:search', $event)"
          label="Search orders"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
        ></v-text-field>
      </v-col>
      
      <!-- Type Filter -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 3">
        <v-select
          :model-value="selectedType"
          @update:model-value="$emit('update:selectedType', $event)"
          :items="orderTypes"
          label="Filter by type"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-filter"
        ></v-select>
      </v-col>

      <!-- Status Filter -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 3">
        <v-select
          :model-value="selectedStatus"
          @update:model-value="$emit('update:selectedStatus', $event)"
          :items="statusTypes"
          label="Filter by status"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-filter-variant"
        ></v-select>
      </v-col>

      <!-- Payment Status Filter -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 3">
        <v-select
          :model-value="selectedPaymentStatus"
          @update:model-value="$emit('update:selectedPaymentStatus', $event)"
          :items="paymentStatusTypes"
          label="Filter by payment status"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-cash-multiple"
        ></v-select>
      </v-col>
    </template>

    <template v-else>
      <!-- Search Field -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 4">
        <v-text-field
          :model-value="search"
          @update:model-value="$emit('update:search', $event)"
          label="Search orders"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
        ></v-text-field>
      </v-col>
      
      <!-- Type Filter -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 4">
        <v-select
          :model-value="selectedType"
          @update:model-value="$emit('update:selectedType', $event)"
          :items="orderTypes"
          label="Filter by type"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-filter"
        ></v-select>
      </v-col>

      <!-- Status Filter -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 4">
        <v-select
          :model-value="selectedStatus"
          @update:model-value="$emit('update:selectedStatus', $event)"
          :items="statusTypes"
          label="Filter by status"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-filter-variant"
        ></v-select>
      </v-col>

      <!-- Payment Status Filter -->
      <v-col :cols="$vuetify.display.mobile ? 12 : 4">
        <v-select
          :model-value="selectedPaymentStatus"
          @update:model-value="$emit('update:selectedPaymentStatus', $event)"
          :items="paymentStatusTypes"
          label="Filter by payment status"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-cash-multiple"
        ></v-select>
      </v-col>
    </template>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'
import { PaidStatus, InvoiceStatus } from '../../../../../types/order'

const props = defineProps({
  search: {
    type: String,
    required: true
  },
  selectedType: {
    type: String,
    required: true
  },
  selectedStatus: {
    type: String,
    required: true,
    default: 'ALL'
  },
  selectedPaymentStatus: {
    type: String,
    default: 'ALL'
  },
  orderTypes: {
    type: Array,
    required: true
  },
  mode: {
    type: String,
    default: 'active', // 'active', 'delivery', or 'history'
    required: false
  }
})

const statusTypes = computed(() => {
  switch (props.mode) {
    case 'delivery':
    case 'history':
      return [
        { title: 'All Status', value: 'ALL' },
        { title: 'Draft', value: 'DRAFT' },
        { title: 'Save Draft', value: 'SAVE_DRAFT' },
        { title: 'Sent', value: 'SENT' },
        { title: 'Viewed', value: 'VIEWED' },
        { title: 'Overdue', value: 'OVERDUE' },
        { title: 'Completed', value: 'COMPLETED' },
        { title: 'Due', value: 'DUE' }
      ]
    default:
      return [
        { title: 'All Status', value: 'ALL' }
      ]
  }
})

const paymentStatusTypes = computed(() => [
  { title: 'All Payment Status', value: 'ALL' },
  { title: 'Paid', value: 'PAID' },
  { title: 'Partially Paid', value: 'PARTIALLY_PAID' },
  { title: 'Unpaid', value: 'UNPAID' }
])

defineEmits(['update:search', 'update:selectedType', 'update:selectedStatus', 'update:selectedPaymentStatus'])
</script>
