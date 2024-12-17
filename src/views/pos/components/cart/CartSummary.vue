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

    <!-- Tax Row -->
    <div class="summary-row">
      <span class="label">Tax ({{ (taxRate * 100).toFixed(1) }}%)</span>
      <span class="amount">${{ formatPrice(taxAmount) }}</span>
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

const props = defineProps({
  subtotal: Number,
  discountAmount: Number,
  taxRate: Number,
  taxAmount: Number,
  total: Number
})

const { discountType, discountValue, updateDiscount } = useCartDiscount()

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
</style>
