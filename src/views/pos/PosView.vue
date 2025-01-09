<!-- src/views/pos/PosView.vue -->
<template>
  <v-layout class="pos-layout fill-height" :class="{ 'mobile-layout': $vuetify.display.smAndDown }">
    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      closable
      class="ma-4"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <!-- Main Content -->
    <template v-if="companyStore.isConfigured">
      <v-main class="pos-main pa-0">
        <v-container fluid class="fill-height pos-container">
          <v-row no-gutters class="fill-height" style="width: 100%; margin: 0;">
            <!-- Left Side - Cart -->
            <v-col 
              cols="12" 
              sm="12" 
              md="5" 
              lg="4" 
              xl="3" 
              class="pos-cart border-r"
              :class="{'pos-cart-mobile': $vuetify.display.smAndDown}"
            >
              <div class="cart-container">
                <pos-cart />
              </div>
            </v-col>

            <!-- Right Side - Products -->
            <v-col 
              cols="12" 
              sm="12" 
              md="7" 
              lg="8" 
              xl="9" 
              class="pos-products"
              :class="{'pos-products-mobile': $vuetify.display.smAndDown}"
            >
              <div class="products-container">
                <pos-products />
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-main>

      <!-- Footer -->
      <pos-footer
        @print-order="printOrder"
        @submit-order="submitOrder"
      />
    </template>

    <!-- Reference Number Dialog -->
    <reference-dialog
      v-model="showReferenceDialog"
      @confirm="confirmHoldOrder"
    />

    <!-- Loading Overlay -->
    <v-overlay
      :model-value="loading"
      class="align-center justify-center"
    >
      <v-progress-circular
        size="64"
        color="primary"
        indeterminate
      />
    </v-overlay>
  </v-layout>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useRouter, useRoute } from 'vue-router'
import { WindowManager } from '@/utils/windowManager'
import PosCart from './components/PosCart.vue'
import PosProducts from './components/PosProducts.vue'
import PosFooter from './components/PosFooter.vue'
import ReferenceDialog from './components/dialogs/ReferenceDialog.vue'
import { useOrderManagement } from './composables/useOrderManagement'
import { useErrorHandling } from './composables/useErrorHandling'
import { logger } from '@/utils/logger'

// Store initialization
const companyStore = useCompanyStore()
const router = useRouter()
const route = useRoute()
const drawer = ref(false)

const isCustomerDisplay = computed(() => {
  return route.path === '/customer-display'
})

// Composables
const {
  showReferenceDialog,
  confirmHoldOrder,
  printOrder,
  submitOrder
} = useOrderManagement()

const {
  error,
  loading,
  clearError
} = useErrorHandling()

// Initialize the POS view
async function initializePos() {
  try {
    logger.startGroup('POS View: Initializing')
    logger.info('Starting POS initialization')

    if (!companyStore.isConfigured) {
      router.push('/select-cashier')
      return
    }

    logger.info('POS initialization complete:', {
      isConfigured: companyStore.isConfigured,
      selectedCustomer: companyStore.selectedCustomer,
      selectedStore: companyStore.selectedStore,
      selectedCashier: companyStore.selectedCashier
    })
  } catch (err) {
    logger.error('Failed to initialize POS view:', err)
    error.value = 'Failed to initialize POS. Please try refreshing the page.'
  } finally {
    logger.endGroup()
  }
}

// Initialize on mount
onMounted(async () => {
  await initializePos()
  
  // Open customer display on secondary screen
  try {
    const customerWindow = await WindowManager.openCustomerDisplay()
    if (!customerWindow) {
      logger.warn('Failed to open customer display on secondary screen')
    }
  } catch (error) {
    logger.error('Error opening customer display:', error)
  }
})
</script>

<style scoped>
.pos-layout {
  display: flex;
  flex-direction: column;
  height: 100vh !important;
  max-height: 100vh !important;
  min-height: 100vh !important;
  overflow: hidden;
  width: 100vw !important;
  max-width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
}

.v-main--pos {
  padding-bottom: 0 !important;
}

.v-main--pos .v-main__wrap {
  padding: 0 !important;
}

.mobile-layout {
  padding-bottom: 64px;
}

:deep(.v-main) {
  flex: 1 1 auto;
  height: calc(100% - 64px);
  overflow: hidden;
  padding-bottom: 0 !important;
}

:deep(.v-main > .v-main__wrap) {
  height: 100%;
  padding: 0 !important;
}

.pos-container {
  height: calc(100vh - 64px) !important;
  min-height: calc(100vh - 64px) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100vw !important;
  max-width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
  position: relative;
}

.pos-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cart-container, .products-container {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.pos-cart, .pos-products {
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

@media (max-width: 600px) {
  :deep(.v-main) {
    height: calc(100% - 64px);
    margin-bottom: 64px;
  }

  .pos-cart-mobile .cart-container, 
  .pos-products-mobile .products-container {
    height: 50vh;
    max-height: calc(100vh - 128px);
    overflow-y: auto;
    position: relative;
  }

  .pos-cart-mobile {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  :deep(.v-main) {
    height: calc(100% - 88px);
    margin-bottom: 88px;
  }

  .cart-container, .products-container {
    height: 100%;
    overflow-y: auto;
  }
}

.border-r {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

/* Mobile Optimizations */
@media (max-width: 600px) {
  .selection-dialog {
    margin: 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 16px 16px 0 0;
  }

  .selection-dialog :deep(.v-card-text) {
    padding: 16px;
  }

  .selection-dialog :deep(.v-list-item) {
    min-height: 56px;
    padding: 8px;
  }
}
</style>
