<!-- src/views/pos/components/cart/CartSummary.vue -->
<template>
  <div class="order-summary">
    <!-- Subtotal Row -->
    <div class="summary-row">
      <span class="label">Subtotal</span>
      <span class="amount">${{ formatPrice(subtotal) }}</span>
    </div>
    
    <!-- Discount Controls -->
    <div class="discount-section">
      <div class="discount-header">
        <span class="label">Discount</span>
        <v-chip
          v-if="discountValue > 0"
          color="success"
          size="small"
          variant="flat"
          class="discount-badge"
        >
          Applied
        </v-chip>
      </div>
      
      <div class="discount-controls">
        <v-select
          v-model="discountType"
          :items="[
            { title: 'Percentage', value: '%' },
            { title: 'Fixed', value: 'fixed' }
          ]"
          item-title="title"
          item-value="value"
          density="compact"
          hide-details
          variant="outlined"
          class="discount-type-select"
          @update:model-value="updateDiscount"
        >
          <template #selection="{ item }">
            {{ item.value === '%' ? '%' : '$' }}
          </template>
        </v-select>
        
        <v-text-field
          v-model="discountValue"
          :prefix="discountType === 'fixed' ? '$' : ''"
          :suffix="discountType === '%' ? '%' : ''"
          density="compact"
          hide-details
          type="number"
          variant="outlined"
          class="discount-value-input"
          @update:model-value="updateDiscount"
        />
      </div>
    </div>

    <!-- Discount Amount Row -->
    <div v-if="discountAmount > 0" class="summary-row discount-amount">
      <span class="label">Discount Applied</span>
      <span class="amount success-text">-${{ formatPrice(discountAmount) }}</span>
    </div>

    <!-- Tax Rows -->
    <div class="tax-section">
      <template v-if="taxTypesStore.loading">
      <div class="summary-row">
        <span class="label">Loading taxes...</span>
        <v-progress-circular
        indeterminate
        size="20"
        width="2"
        />
      </div>
      </template>
      <template v-else-if="availableTaxTypes.length > 0">
      {{ console.log('Available Tax Types:', availableTaxTypes) }}
      <div v-for="tax in availableTaxTypes" :key="tax.id" class="summary-row tax-row">
        {{ console.log('Processing tax:', tax) }}
        {{ console.log('Calculated tax amount:', calculateTaxAmount(tax)) }}
        <span class="label">{{ tax.name }} ({{ formatTaxPercent(tax.percent) }}%)</span>
        <span class="amount">${{ formatPrice(calculateTaxAmount(tax)) }}</span>
      </div>
      <div v-if="availableTaxTypes.length > 1" class="summary-row tax-total">
        {{ console.log('Total tax amount:', totalTaxAmount) }}
        <span class="label">Total Tax</span>
        <span class="amount">${{ formatPrice(totalTaxAmount) }}</span>
      </div>
      </template>
      <div v-else class="summary-row tax-row">
      {{ console.log('No tax types available') }}
      <span class="label">No taxes configured</span>
      <span class="amount">$0.00</span>
      </div>
    </div>
    
    <v-divider class="my-4" />

    <!-- Total Row -->
    <div class="summary-row total">
      <span class="label">Total</span>
      <span class="amount">${{ formatPrice(total) }}</span>
    </div>
  </div>
</template>

<script setup>
import { useCartDiscount } from '../../composables/useCartDiscount'
import { useTaxTypesStore } from '@/stores/tax-types'
import { onMounted, computed } from 'vue'
import { logger } from '@/utils/logger'
import { PriceUtils } from '@/utils/price'

const props = defineProps({
  subtotal: Number,
  discountAmount: Number,
  total: Number
  // Removed taxRate and taxAmount props as they're now handled by the tax types store
})

const taxTypesStore = useTaxTypesStore()

const { discountType, discountValue, updateDiscount } = useCartDiscount()

const availableTaxTypes = computed(() => {
  const taxes = taxTypesStore.availableTaxTypes
  logger.debug('Available taxes in component:', taxes)
  return taxes
})

const calculateTaxAmount = (tax) => {
  const baseAmount = props.subtotal - props.discountAmount
  // Convert percentage to decimal for calculation (e.g., 0.55% = 0.0055)
  const taxRate = tax.percent / 100
  return Math.round(baseAmount * taxRate)
}

const totalTaxAmount = computed(() => {
  return availableTaxTypes.value.reduce((sum, tax) => {
    return sum + calculateTaxAmount(tax)
  }, 0)
})

const formatTaxPercent = (percent) => {
  // Display as actual percentage (e.g., 0.55% instead of 55%)
  return percent.toFixed(2)
}

onMounted(async () => {
  logger.debug('CartSummary mounted, fetching tax types')
  await taxTypesStore.fetchTaxTypes()
})

// Format price for display, converting from cents to dollars if needed
const formatPrice = (amount) => {
  // Convert the amount to a fixed decimal string
  return Number(amount / 100).toFixed(2)
}
</script>

<style scoped>
.order-summary {
  padding: 4px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 1rem;
}

.summary-row .label {
  color: rgba(0, 0, 0, 0.7);
  font-weight: 500;
}

.summary-row .amount {
  font-weight: 600;
}

.summary-row.total {
  font-size: 1.25rem;
  margin-bottom: 0;
}

.summary-row.total .label {
  color: rgba(0, 0, 0, 0.87);
  font-weight: 600;
}

.summary-row.total .amount {
  font-weight: 700;
  color: var(--v-primary-base);
}

.discount-section {
  background-color: rgb(250, 250, 250);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
}

.discount-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.discount-badge {
  font-size: 0.75rem;
}

.discount-controls {
  display: flex;
  gap: 8px;
}

.discount-type-select {
  width: 100px;
}

.discount-value-input {
  width: 120px;
}

.discount-type-select :deep(.v-field__input),
.discount-value-input :deep(.v-field__input) {
  padding: 8px 12px;
}

.success-text {
  color: rgb(var(--v-theme-success));
}

.discount-amount {
  background-color: rgb(var(--v-theme-success), 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  margin: 12px 0;
}

@media (max-width: 600px) {
  .discount-controls {
    flex-wrap: wrap;
  }
  
  .discount-type-select,
  .discount-value-input {
    width: 100%;
  }
}

.tax-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.tax-row {
  margin-bottom: 4px;
}

.tax-total {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
}
</style>
