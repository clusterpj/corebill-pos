<!-- src/views/Items.vue -->
<template>
  <div class="items-management pa-4">
    <!-- System Prerequisites Check -->
    <v-alert
      v-if="!posStore.systemReady"
      type="warning"
      class="mb-4"
    >
      {{ posStore.setupMessage }}
    </v-alert>

    <template v-else>
      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        class="mb-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <!-- Search and Actions Bar -->
      <div class="d-flex gap-2 mb-4">
        <v-text-field
          v-model="posStore.searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="Search items"
          density="compact"
          hide-details
          class="flex-grow-1"
          @update:model-value="handleSearch"
        />
        
        <v-btn
          color="success"
          prepend-icon="mdi-plus"
          @click="openItemModal()"
        >
          New Item
        </v-btn>
        
        <v-btn
          v-if="selectedItems.length > 0"
          color="error"
          prepend-icon="mdi-delete"
          @click="confirmDeleteSelected"
        >
          Delete ({{ selectedItems.length }})
        </v-btn>
      </div>

      <!-- Categories -->
      <v-tabs
        v-model="selectedCategory"
        density="compact"
        class="mb-4"
        show-arrows
        @update:model-value="handleCategoryChange"
      >
        <v-tab value="all">All Items</v-tab>
        <v-tab
          v-for="category in posStore.categoriesForDisplay"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </v-tab>
      </v-tabs>

      <!-- Loading State -->
      <div v-if="posStore.loading.products" class="d-flex justify-center ma-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Error State -->
      <v-alert
        v-else-if="posStore.error"
        type="error"
        class="ma-4"
      >
        {{ posStore.error }}
      </v-alert>

      <!-- Items Table -->
      <v-data-table
        v-else
        v-model="selectedItems"
        :headers="headers"
        :items="posStore.products"
        :loading="posStore.loading.products"
        show-select
      >
        <!-- Image Column -->
        <template v-slot:item.image="{ item }">
          <v-img
            :src="getImageUrl(item)"
            width="50"
            height="50"
            cover
            class="bg-grey-lighten-2"
          />
        </template>

        <!-- Price Column -->
        <template v-slot:item.price="{ item }">
          ${{ formatPrice(item.price) }}
        </template>

        <!-- Stock Column -->
        <template v-slot:item.stock="{ item }">
          <v-chip
            :color="item.stock > 0 ? 'success' : 'error'"
            size="small"
          >
            {{ item.stock }}
          </v-chip>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            color="primary"
            variant="text"
            @click="openItemModal(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            color="error"
            variant="text"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>

      <!-- Pagination -->
      <div 
        v-if="posStore.products.length > 0"
        class="d-flex justify-center mt-4"
      >
        <v-pagination
          v-model="posStore.currentPage"
          :length="Math.ceil(posStore.totalItems / posStore.itemsPerPage)"
          @update:model-value="posStore.setPage"
        />
      </div>
    </template>

    <!-- Item Management Modal -->
    <ItemManagementModal
      v-model="showItemModal"
      :edit-item="editingItem"
      @item-saved="handleItemSaved"
      @error="handleError"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete {{ deletingMultiple ? `${selectedItems.length} items` : 'this item' }}?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="posStore.loading.itemOperation"
            @click="deleteConfirmed"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePosStore } from '../stores/pos-store'
import { logger } from '../utils/logger'
import ItemManagementModal from '../components/items/ItemManagementModal.vue'

const posStore = usePosStore()

// Local state
const selectedCategory = ref(posStore.selectedCategory)
const error = ref(null)
const selectedItems = ref([])
const showDeleteDialog = ref(false)
const deletingMultiple = ref(false)
const showItemModal = ref(false)
const editingItem = ref(null)
const itemToDelete = ref(null)

// Table headers
const headers = [
  { title: 'Image', key: 'image', sortable: false },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'SKU', key: 'sku', sortable: true },
  { title: 'Price', key: 'price', sortable: true },
  { title: 'Stock', key: 'stock', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

// Computed
const deletingMultipleComputed = computed(() => selectedItems.value.length > 0 && !editingItem.value)

// Format price from cents to dollars
const formatPrice = (price) => {
  if (!price) return '0.00'
  const priceInDollars = Number(price) / 100
  return priceInDollars.toFixed(2)
}

// Get proper image URL
const getImageUrl = (item) => {
  if (item.media && item.media.length > 0 && item.media[0].original_url) {
    return item.media[0].original_url
  }
  if (item.picture) {
    return item.picture
  }
  return '/api/placeholder/400/320'
}

onMounted(async () => {
  logger.startGroup('Items Management: Mount')
  try {
    await posStore.initialize()
  } catch (err) {
    logger.error('Error during initialization', err)
    error.value = err.message || 'Failed to initialize'
  } finally {
    logger.endGroup()
  }
})

const handleSearch = async () => {
  logger.startGroup('Items Management: Search')
  try {
    await posStore.fetchProducts()
  } catch (err) {
    logger.error('Search failed', err)
    error.value = err.message || 'Search failed'
  } finally {
    logger.endGroup()
  }
}

const handleCategoryChange = async (categoryId) => {
  logger.startGroup('Items Management: Category Change')
  try {
    await posStore.setCategory(categoryId)
  } catch (err) {
    logger.error('Category change failed', err)
    error.value = err.message || 'Failed to change category'
  } finally {
    logger.endGroup()
  }
}

// Item Management Operations
const openItemModal = (item = null) => {
  editingItem.value = item
  showItemModal.value = true
  error.value = null // Clear any previous errors
}

const handleItemSaved = async (response) => {
  logger.info('Item saved:', response)
  showItemModal.value = false // Close modal on success
  editingItem.value = null
  await posStore.fetchProducts() // Refresh the list
}

const handleError = (errorMessage) => {
  error.value = errorMessage
}

const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteDialog.value = true
}

const confirmDeleteSelected = () => {
  itemToDelete.value = null
  showDeleteDialog.value = true
}

const deleteConfirmed = async () => {
  try {
    if (deletingMultipleComputed.value) {
      await posStore.deleteMultipleItems(selectedItems.value)
      selectedItems.value = []
    } else {
      await posStore.deleteItem(itemToDelete.value.id)
    }
    showDeleteDialog.value = false
    itemToDelete.value = null
  } catch (err) {
    logger.error('Delete operation failed:', err)
    error.value = err.message || 'Failed to delete item(s)'
  }
}
</script>

<style scoped>
.items-management {
  height: 100%;
  overflow-y: auto;
}
</style>
