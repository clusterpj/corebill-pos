<!-- src/views/pos/components/PosProducts.vue -->
<template>
  <div class="pos-products-container">
    <!-- System Prerequisites Check -->
    <v-alert
      v-if="!posStore.systemReady"
      type="warning"
      class="ma-2"
    >
      {{ posStore.setupMessage }}
    </v-alert>

    <template v-else>
      <div class="products-header">
        <v-container fluid class="pa-4">
          <!-- Search and Grid Settings Row -->
          <v-row no-gutters align="center" class="mb-4 flex-column flex-sm-row">
            <v-col cols="12" sm="7" md="8" lg="9" class="pe-sm-4 mb-3 mb-sm-0">
              <div class="search-field">
                <product-search 
                  :loading="posStore.loading.products"
                  @search="handleSearch"
                  @quick-add="handleQuickAdd" 
                />
              </div>
            </v-col>
            <v-col cols="12" sm="5" md="4" lg="3" class="d-flex justify-end align-center">
              <v-btn
                prepend-icon="mdi-cog"
                variant="outlined"
                color="primary"
                size="small"
                class="grid-settings-btn me-2"
                @click="showGridSettings = true"
              >
                Grid Settings
              </v-btn>
              
              <v-btn
                prepend-icon="mdi-cached"
                variant="outlined"
                color="warning"
                size="small"
                class="clear-cache-btn"
                @click="clearCache"
                :loading="clearingCache"
              >
                Clear Cache
              </v-btn>

              <v-dialog
                v-model="showGridSettings"
                max-width="800"
                transition="dialog-bottom-transition"
              >
                <v-card>
                  <v-card-title class="d-flex justify-space-between align-center pa-4 bg-primary text-white">
                    <span class="text-h6">Grid Display Settings</span>
                    <v-btn
                      icon="mdi-close"
                      variant="text"
                      size="small"
                      @click="showGridSettings = false"
                    />
                  </v-card-title>
                  
                  <v-card-text class="pa-6">
                    <grid-settings
                      v-model="gridSettings"
                      @update:model-value="updateGridSettings"
                    />
                  </v-card-text>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>

          <!-- Categories Row -->
          <v-row no-gutters>
            <v-col cols="12">
              <category-tabs
                :categories="posStore.categoriesForDisplay"
                @change="handleCategoryChange"
              />
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container fluid class="products-content pa-0" style="max-width: none;">
        <div class="products-scroll-container">
          <!-- Loading State -->
          <div v-if="posStore.loading.products" class="products-loading-state">
            <v-progress-circular
              indeterminate
              color="primary"
              size="32"
            />
          </div>

          <!-- Products Grid with Pagination -->
          <div v-else-if="posStore.products.length > 0" class="products-grid-container">
            <product-grid
              :products="posStore.products"
              :grid-settings="gridSettings"
              @select="quickAdd"
              class="products-grid"
            />
            
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="7"
              class="mt-4"
              @update:model-value="handlePageChange"
            />
          </div>

          <!-- Empty State -->
          <v-alert
            v-else
            type="info"
            variant="tonal"
            class="mx-4 products-empty-state"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-information" />
            </template>
            No items found
          </v-alert>
        </div>
      </v-container>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
const showGridSettings = ref(false)
const clearingCache = ref(false)

const clearCache = async () => {
  clearingCache.value = true
  try {
    const success = await posStore.clearCache()
    if (success) {
      window.toastr?.success('Product cache cleared and preloaded successfully')
      // Reset pagination and force refresh
      currentPage.value = 1
      await posStore.fetchProducts(currentPage.value, itemsPerPage.value)
    }
  } catch (error) {
    logger.error('Failed to clear and preload cache', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    window.toastr?.error(`Failed to clear and preload cache: ${error.message}`)
  } finally {
    clearingCache.value = false
  }
}
import { usePosStore } from '../../../stores/pos-store'
import { useCartStore } from '../../../stores/cart-store'
import { logger } from '../../../utils/logger'

import ProductSearch from './products/ProductSearch.vue'
import CategoryTabs from './products/CategoryTabs.vue'
import ProductGrid from './products/ProductGrid.vue'
import GridSettings from './products/GridSettings.vue'

const posStore = usePosStore()
const cartStore = useCartStore()

// Grid Settings with localStorage persistence
const gridSettings = ref(
  JSON.parse(localStorage.getItem('gridSettings')) || {
    layout: 'comfortable',
    columns: 4,
    rows: 3
  }
)

// Save grid settings to localStorage when they change
const updateGridSettings = (newSettings) => {
  gridSettings.value = newSettings
  localStorage.setItem('gridSettings', JSON.stringify(newSettings))
  showGridSettings.value = false
}

watch(gridSettings, (newSettings) => {
  localStorage.setItem('gridSettings', JSON.stringify(newSettings))
}, { deep: true })

onMounted(async () => {
  logger.startGroup('POS Products Component: Mount')
  try {
    await posStore.initialize()
  } catch (err) {
    logger.error('Error during initialization', err)
  } finally {
    logger.endGroup()
  }
})

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(50)
const totalPages = computed(() => Math.ceil(posStore.totalItems / itemsPerPage.value))

const handleSearch = async (query) => {
  logger.startGroup('POS Products: Search')
  try {
    posStore.searchQuery = query
    currentPage.value = 1
    await posStore.fetchProducts(currentPage.value, itemsPerPage.value)
  } catch (err) {
    logger.error('Search failed', err)
  } finally {
    logger.endGroup()
  }
}

const handlePageChange = async (page) => {
  logger.startGroup('POS Products: Page Change')
  try {
    await posStore.fetchProducts(page, itemsPerPage.value)
  } catch (err) {
    logger.error('Page change failed', err)
  } finally {
    logger.endGroup()
  }
}

const handleCategoryChange = async (categoryId) => {
  logger.startGroup('POS Products: Category Change')
  try {
    currentPage.value = 1
    await posStore.setCategory(categoryId)
    await posStore.fetchProducts(currentPage.value, itemsPerPage.value)
  } catch (err) {
    logger.error('Category change failed', err)
  } finally {
    logger.endGroup()
  }
}

const quickAdd = (product) => {
  if (product.stock <= 0) return
  
  // Log the full product object for debugging
  logger.debug('[PosProducts] Product selected:', {
    id: product.id,
    name: product.name,
    price: product.price,
    section: {
      id: product.section_id,
      type: product.section_type,
      name: product.section_name
    },
    rawProduct: product // Log the raw product for debugging
  })
  
  // Create a new product object with all necessary fields
  const fullProduct = {
    ...product,
    section_id: product.section_id,
    section_type: product.section_type || 'other',
    section_name: product.section_name || 'Default'
  }
  
  logger.info('[PosProducts] Adding product to cart:', { 
    id: fullProduct.id,
    name: fullProduct.name,
    price: fullProduct.price,
    section: {
      id: fullProduct.section_id,
      type: fullProduct.section_type,
      name: fullProduct.section_name
    }
  })
  
  cartStore.addItem(fullProduct, 1)
}

const handleQuickAdd = async (searchTerm) => {
  logger.startGroup('POS Products: Quick Add by Search')
  try {
    // First try to find by SKU
    const productBySku = posStore.products.find(p => 
      p.sku?.toLowerCase() === searchTerm.toLowerCase()
    )
    
    if (productBySku) {
      quickAdd(productBySku)
      return
    }
    
    // If no SKU match, try name match
    const productByName = posStore.products.find(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (productByName) {
      quickAdd(productByName)
    } else {
      // If product not in current list, try to fetch it directly by SKU
      const response = await posApi.getItems({
        sku: searchTerm,
        is_pos: 1,
        id: companyStore.selectedStore,
        limit: 1
      })
      
      if (response.items?.data?.[0]) {
        quickAdd(response.items.data[0])
      } else {
        logger.warn('No matching product found for quick add', { searchTerm })
      }
    }
  } catch (err) {
    logger.error('Quick add failed', err)
  } finally {
    logger.endGroup()
  }
}
</script>

<style scoped>
.pos-products-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(250, 250, 250);
  overflow: hidden;
  contain: strict;
  position: relative;
}

.products-header {
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  position: sticky;
  top: 0;
  z-index: 2;
  flex-shrink: 0;
  height: 140px;
  contain: layout size paint;
}

.products-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.products-scroll-container {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.products-loading-state {
  position: absolute;
  top: 140px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgb(250, 250, 250);
  z-index: 1;
}

.products-grid-container {
  width: 100%;
  min-height: calc(100vh - 204px);
  height: calc(100vh - 204px);
  display: flex;
  flex-direction: column;
}

.products-grid {
  flex: 1;
  contain: layout size style;
  position: relative;
  display: flex;
  overflow-y: auto;
  padding: 8px;
}

.v-pagination {
  justify-content: center;
  padding: 16px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.products-empty-state {
  height: calc(100vh - 204px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-field {
  width: 100%;
  max-width: 800px;
}

.grid-settings-btn {
  min-width: 135px;
}

.clear-cache-btn {
  min-width: 120px;
}

@media (max-width: 600px) {
  .grid-settings-btn,
  .clear-cache-btn {
    min-width: auto;
    padding: 0 12px;
  }
  
  .clear-cache-btn {
    margin-left: 4px;
  }
}

@media (max-width: 600px) {
  .pos-products-container {
    max-height: calc(100vh - 96px);
    min-height: 300px;
  }
  
  .products-header {
    min-height: 120px;
  }
  
  .products-loading-state,
  .products-grid {
    min-height: 300px;
  }
  
  .products-header .v-container {
    padding: 8px;
  }
  
  .grid-settings-btn {
    min-width: auto;
    padding: 0 12px;
  }
}

/* Tablet Optimizations */
@media (max-width: 960px) {
  .products-header {
    padding: 8px 0;
  }
}

/* Mobile Optimizations */
@media (max-width: 600px) {
  .products-header .v-container {
    padding: 8px 12px;
  }
  
  .search-field {
    max-width: 100%;
  }
}
</style>
