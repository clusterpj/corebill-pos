<!-- src/views/pos/components/PosCart.vue -->
<template>
  <div class="pos-cart-container" style="max-width: none;">
    <v-card class="cart-header" flat>
      <v-toolbar
        density="comfortable"
        color="primary"
        class="rounded-t-lg"
      >
        <v-toolbar-title class="text-h6 font-weight-medium">
          {{ cartStore.isEditingInvoice ? 'Edit Invoice' : 'Current Order' }}
        </v-toolbar-title>
        
        <v-spacer></v-spacer>

        <v-btn
          v-if="cartStore.canUpdateInvoice"
          color="white"
          variant="text"
          :loading="updating"
          @click="handleUpdateInvoice"
          prepend-icon="mdi-content-save"
          class="text-none"
        >
          Update Invoice
        </v-btn>
        
        <v-btn
          v-else-if="cartStore.isHoldOrder"
          color="white"
          variant="text"
          :loading="updating"
          @click="updateOrder"
          prepend-icon="mdi-content-save"
          class="text-none"
        >
          Update
        </v-btn>
        
        <v-btn
          color="white"
          variant="text"
          :disabled="cartStore.isEmpty"
          @click="clearOrder"
          prepend-icon="mdi-delete-outline"
          class="text-none ml-2"
        >
          Clear
        </v-btn>
      </v-toolbar>

      <div v-if="cartStore.isHoldOrder" class="px-4 py-2 bg-warning-lighten-4">
        <div class="d-flex align-center">
          <v-icon
            icon="mdi-clock-outline"
            color="warning"
            class="mr-2"
          />
          <span class="text-warning text-body-2 font-weight-medium">
            Held Order: {{ cartStore.holdOrderDescription || 'No Description' }}
          </span>
        </div>
      </div>
    </v-card>

    <v-card
      class="cart-scrollable-content mx-2 mt-2"
      variant="flat"
      :class="{ 'empty-cart': cartStore.isEmpty }"
    >
      <template v-if="cartStore.isEmpty">
        <div class="empty-state pa-8 text-center">
          <v-icon
            icon="mdi-cart-outline"
            size="64"
            color="grey-lighten-1"
            class="mb-4"
          />
          <h3 class="text-h6 font-weight-medium text-grey-darken-1">Cart is Empty</h3>
          <p class="text-body-2 text-grey-darken-1 mt-2">
            Add items from the product list to get started.
          </p>
        </div>
      </template>

      <template v-else>
        <cart-item-list
          :items="cartStore.items"
          @edit="editItem"
          @remove="removeItem"
          @update-quantity="updateQuantity"
          class="cart-items-list"
        />
      </template>
    </v-card>

    <!-- Order Notes -->
    <v-card
      v-if="!cartStore.isEmpty"
      class="mx-2 mt-2"
      variant="flat"
    >
      <order-notes />
    </v-card>

    <!-- Order Summary -->
    <v-card
      class="cart-summary-wrapper mx-2 mt-2 mb-2"
      elevation="2"
      rounded="lg"
    >
      <v-card-text class="pa-4">
        <cart-summary
          :subtotal="cartStore.subtotal"
          :discount-amount="cartStore.discountAmount"
          :tax-rate="cartStore.taxRate"
          :tax-amount="cartStore.taxAmount"
          :total="cartStore.total"
        />
      </v-card-text>
    </v-card>

    <!-- Edit Item Dialog -->
    <edit-item-dialog
      v-model="showEditDialog"
      :item="editingItem"
      :index="editingIndex"
      max-width="500"
      transition="dialog-bottom-transition"
      persistent
    >
      <template #default>
        <v-card>
          <v-card-title class="text-h6 pa-4">
            Edit Item
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="showEditDialog = false"
              class="float-right"
            />
          </v-card-title>
          <v-card-text class="pa-4">
            <!-- Edit form content here -->
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn
              color="grey-darken-1"
              variant="text"
              @click="showEditDialog = false"
              class="text-none"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              @click="saveChanges"
              class="text-none"
              :loading="saving"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </edit-item-dialog>

    <!-- Loading Overlay -->
    <v-overlay
      :model-value="cartStore.loading"
      class="align-center justify-center"
    >
      <v-progress-circular
        size="64"
        color="primary"
        indeterminate
      />
    </v-overlay>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CartItemList from './cart/CartItemList.vue'
import CartSummary from './cart/CartSummary.vue'
import { logger } from '../../../utils/logger'
import EditItemDialog from './cart/EditItemDialog.vue'
import OrderNotes from './cart/OrderNotes.vue'
import { useCart } from './cart/composables/useCart'

const { cartStore, updating, clearOrder, updateQuantity, removeItem, updateOrder, splitItem } = useCart()

const handleUpdateInvoice = async () => {
  try {
    if (!cartStore.items || cartStore.items.length === 0) {
      window.toastr?.error('Cannot update invoice: Cart is empty')
      return
    }
    
    // Preserve original customer and company information
    const originalInvoice = cartStore.currentInvoice || {}
    const updateData = {
      ...cartStore.currentInvoice,
      contact_id: originalInvoice.contact_id || originalInvoice.customer_id,
      company_id: originalInvoice.company_id,
      first_name: originalInvoice.first_name,
      last_name: originalInvoice.last_name,
      email: originalInvoice.email,
      phone: originalInvoice.phone
    }

    // Defensive checks
    if (!updateData.company_id) {
      console.warn('No company_id found in original invoice')
      updateData.company_id = cartStore.currentCompanyId // Fallback to current company
    }

    if (!updateData.contact_id) {
      console.warn('No contact_id found in original invoice')
    }

    await cartStore.updateInvoice(updateData)
    clearOrder()
  } catch (error) {
    console.error('Failed to update invoice:', error)
    window.toastr?.error('Failed to update invoice: ' + (error.message || 'Unknown error'))
  }
}


// Local state for edit dialog
const showEditDialog = ref(false)
const editingItem = ref(null)
const editingIndex = ref(null)

// Methods
const editItem = (item, index) => {
  editingItem.value = { ...item }
  editingIndex.value = index
  showEditDialog.value = true
}
</script>

<style scoped>
.pos-cart-container {
  height: 100% !important;
  min-height: 100% !important;
  display: flex;
  flex-direction: column;
  background-color: rgb(245, 245, 245);
  overflow: hidden;
  width: 100% !important;
  padding: 0.5rem;
  position: relative;
  contain: strict;
}

.cart-header {
  flex-shrink: 0;
  z-index: 2;
  border-radius: 8px 8px 0 0;
}

.cart-scrollable-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background-color: white;
}

.empty-cart {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 2px dashed rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}

.cart-items-list {
  padding: 0.25rem;
}

.cart-summary-wrapper {
  flex-shrink: 0;
  background-color: white;
  margin-top: auto;
  z-index: 2;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* Mobile Optimizations */
@media (max-width: 600px) {
  .pos-cart-container {
    height: calc(50vh - 32px); /* Account for footer height */
    min-height: 300px;
    max-height: calc(100vh - 64px);
  }

  .cart-scrollable-content {
    height: calc(100% - 100px); /* Adjust for mobile header + summary */
    min-height: 200px;
  }
}

/* Tablet and Desktop */
@media (min-width: 601px) {
  .pos-cart-container {
    height: calc(100vh - 64px); /* Account for main padding and footer */
  }
}
</style>
