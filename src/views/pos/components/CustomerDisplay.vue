<template>
  <v-container fluid class="fill-height pa-0">
    <v-row class="fill-height ma-0">
      <!-- Cart Section -->
      <v-col cols="12" md="7" class="pa-4">
        <v-fade-transition>
          <v-card class="cart-display h-100 d-flex flex-column" elevation="2" v-show="!isRefreshing">
            <v-card-title class="text-center text-h5 py-4 flex-shrink-0">
              Current Order
              <div v-if="currentStore" class="text-caption text-primary">
                {{ currentStore.name }} (Store #{{ currentStore.id }})
              </div>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="flex-grow-1 d-flex flex-column pa-0">
              <div class="flex-grow-1 overflow-y-auto">
                <v-list v-if="cartItems && cartItems.length > 0" class="order-items">
                  <v-list-item
                    v-for="(item, index) in cartItems"
                    :key="index"
                    :title="item.name"
                    :subtitle="`${formatPrice(item.price)} each`"
                    class="py-2"
                  >
                    <template v-slot:prepend>
                      <v-chip size="small" color="grey-lighten-3" class="mr-2">
                        {{ item.quantity }}
                      </v-chip>
                    </template>
                    <template v-slot:append>
                      {{ formatPrice(item.price * item.quantity) }}
                    </template>
                  </v-list-item>
                </v-list>

                <v-sheet v-else class="d-flex align-center justify-center fill-height">
                  <div class="text-center">
                    <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-cart-outline</v-icon>
                    <div class="text-subtitle-1 text-grey">No items in cart</div>
                  </div>
                </v-sheet>
              </div>

              <v-divider></v-divider>

              <div class="cart-summary pa-4">
                <v-list density="compact" class="totals">
                  <v-list-item density="compact">
                    <template v-slot:title>
                      <div class="d-flex justify-space-between">
                        <span>Subtotal</span>
                        <span>{{ formatPrice(cartSubtotal) }}</span>
                      </div>
                    </template>
                  </v-list-item>

                  <v-list-item v-if="cartDiscountValue > 0" density="compact">
                    <template v-slot:title>
                      <div class="d-flex justify-space-between">
                        <span>Discount {{ cartDiscountType === '%' ? `(${cartDiscountValue}%)` : '' }}</span>
                        <span class="text-error">-{{ formatPrice(cartDiscountAmount) }}</span>
                      </div>
                    </template>
                  </v-list-item>

                  <v-list-item density="compact">
                    <template v-slot:title>
                      <div class="d-flex justify-space-between">
                        <span>Tax ({{ (cartTaxRate * 100).toFixed(1) }}%)</span>
                        <span>{{ formatPrice(cartTaxAmount) }}</span>
                      </div>
                    </template>
                  </v-list-item>

                  <v-divider class="my-2"></v-divider>

                  <v-list-item density="compact">
                    <template v-slot:title>
                      <div class="d-flex justify-space-between text-h5 font-weight-bold">
                        <span>Total</span>
                        <span>{{ formatPrice(cartTotal) }}</span>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </v-card-text>
          </v-card>
        </v-fade-transition>
      </v-col>

      <!-- Promo Section -->
      <v-col cols="12" md="5" class="pa-0 d-flex">
        <PromoSlider class="fill-height w-100" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCartStore } from '@/stores/cart-store'
import { useCompanyStore } from '@/stores/company'
import { storeToRefs } from 'pinia'
import { logger } from '@/utils/logger'
import { cartSync } from '@/services/cartSync'
import PromoSlider from './PromoSlider.vue'

logger.info('CustomerDisplay component initializing...')

const cartStore = useCartStore()
const companyStore = useCompanyStore()
const isRefreshing = ref(false)
let refreshInterval: number | null = null
let updateTimeout: number | null = null

// Get current store from company store
const currentStore = computed(() => {
  const store = companyStore.stores.find(s => s.id === companyStore.selectedStore)
  logger.debug('Current store computed:', store)
  return store
})

// Use storeToRefs for reactive cart properties
const { 
  items: cartItems,
  discountType: cartDiscountType,
  discountValue: cartDiscountValue,
  taxRate: cartTaxRate,
  subtotal: cartSubtotal,
  taxAmount: cartTaxAmount,
  discountAmount: cartDiscountAmount,
  total: cartTotal
} = storeToRefs(cartStore)

// Format price helper
const formatPrice = (cents: number): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format((cents || 0) / 100)
  return formatted
}

// Handle cart updates
let unsubscribeFromCartSync: (() => void) | null = null

// Refresh data with transition
const refreshData = async () => {
  if (isRefreshing.value) return

  isRefreshing.value = true
  
  // Shorter fade out
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // Update data
  cartStore.initializeFromStorage()
  
  // Almost immediate show of new content
  await new Promise(resolve => setTimeout(resolve, 20))
  
  isRefreshing.value = false
}

// Start periodic refresh
const startAutoRefresh = () => {
  if (refreshInterval) return
  
  // Refresh every second
  refreshInterval = window.setInterval(() => {
    refreshData()
  }, 1000)
  
  logger.info('Auto-refresh started')
}

// Stop periodic refresh
const stopAutoRefresh = () => {
  if (refreshInterval) {
    window.clearInterval(refreshInterval)
    refreshInterval = null
  }
  
  if (updateTimeout) {
    window.clearTimeout(updateTimeout)
    updateTimeout = null
  }
  
  logger.info('Auto-refresh stopped')
}

onMounted(async () => {
  logger.info('CustomerDisplay mounted, initializing cart sync...')
  
  // Initialize from storage first
  cartStore.initializeFromStorage()
  
  // Subscribe to cart updates
  unsubscribeFromCartSync = cartSync.subscribeToUpdates((newState) => {
    logger.info('Received cart update:', newState)
    cartStore.$patch(newState)
  })

  // Start auto-refresh
  startAutoRefresh()

  // Attempt to enter fullscreen mode
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen()
      logger.info('✅ Entered fullscreen mode successfully')
    }
  } catch (error) {
    logger.warn('⚠️ Failed to enter fullscreen mode:', error)
  }

  logger.info('CustomerDisplay initialized:', {
    store: currentStore.value,
    cartItems: cartItems.value?.length || 0,
    cartTotal: cartTotal.value || 0
  })
})

onUnmounted(() => {
  // Clean up subscription
  if (unsubscribeFromCartSync) {
    unsubscribeFromCartSync()
  }
  
  // Stop auto-refresh
  stopAutoRefresh()
})
</script>

<style scoped>
:deep(html),
:deep(body),
:deep(#app) {
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  background: transparent !important;
}

:deep(.v-application__wrap) {
  min-height: 100vh !important;
  height: 100vh !important;
  overflow: hidden !important;
  background: transparent !important;
}

:deep(.v-container) {
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
}

:deep(.v-row) {
  margin: 0 !important;
  padding: 0 !important;
  height: 100vh !important;
}

:deep(.v-col) {
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.v-application__wrap) {
  min-height: 100vh !important;
  height: 100vh !important;
  overflow: hidden !important;
}

.customer-display-layout {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.cart-display {
  will-change: opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
  height: 100%;
  max-height: 100vh;
  overflow: hidden;
}

.order-items {
  will-change: opacity;
}

.cart-summary {
  background: #f5f5f5;
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.v-container {
  max-width: 100vw;
  max-height: 100vh;
  overflow: hidden;
}

.v-row {
  min-height: 100vh;
}

.v-col {
  overflow: hidden;
}

.totals {
  background: transparent !important;
}

.v-fade-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.v-fade-transition-enter-from,
.v-fade-transition-leave-to {
  opacity: 0.98;
}

.v-fade-transition-enter-to,
.v-fade-transition-leave-from {
  opacity: 1;
}

/* Add hardware acceleration */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
