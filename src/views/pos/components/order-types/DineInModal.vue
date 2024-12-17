<template>
  <v-dialog 
    v-model="dialog" 
    fullscreen
    transition="dialog-bottom-transition"
    :scrim="false"
  >
    <template v-slot:activator="{ props: dialogProps }">
      <v-btn
        color="primary"
        v-bind="dialogProps"
        prepend-icon="mdi-table-furniture"
        :loading="loading"
        :disabled="disabled || cartStore.isEmpty"
        class="text-none px-6"
        rounded="pill"
        :elevation="$vuetify.display.mobile ? 1 : 2"
        size="large"
        :block="$vuetify.display.mobile"
      >
        <span class="text-subtitle-1 font-weight-medium">DINE IN</span>
      </v-btn>
    </template>

    <v-card class="modal-card">
      <v-toolbar
        color="primary"
        density="comfortable"
      >
        <v-toolbar-title class="text-h6 font-weight-medium">
          Table Selection
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="closeModal"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 fill-height d-flex flex-column">
        <v-container fluid class="flex-grow-1 pa-4">
          <!-- Loading State -->
          <v-row v-if="loading" class="fill-height">
            <v-col cols="12" class="d-flex align-center justify-center">
              <v-progress-circular indeterminate size="64"></v-progress-circular>
            </v-col>
          </v-row>

          <!-- Error State -->
          <v-row v-else-if="error" class="fill-height">
            <v-col cols="12" class="d-flex align-center justify-center">
              <v-alert type="error" variant="tonal" width="100%" max-width="500">
                {{ error }}
                <template v-slot:append>
                  <v-btn color="error" variant="text" @click="retryLoadTables">
                    Retry
                  </v-btn>
                </template>
              </v-alert>
            </v-col>
          </v-row>

          <!-- No Tables State -->
          <v-row v-else-if="!tables.length" class="fill-height">
            <v-col cols="12" class="d-flex align-center justify-center">
              <v-alert type="info" variant="tonal" width="100%" max-width="500">
                No tables available for this cash register
              </v-alert>
            </v-col>
          </v-row>

          <!-- Table Grid -->
          <v-row v-else class="table-grid">
            <v-col
              v-for="table in tables"
              :key="table.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              class="table-col pa-2"
            >
              <v-hover v-slot="{ isHovering, props: hoverProps }">
                <v-card
                  v-bind="hoverProps"
                  :elevation="isHovering ? 4 : 1"
                  :class="[
                    'table-card',
                    'transition-swing',
                    isTableSelected(table.id) ? 'selected' : '',
                    isTableAvailable(table) ? 'available' : 'occupied'
                  ]"
                  @click="handleTableClick(table)"
                >
                  <v-card-item class="pa-2">
                    <div class="d-flex justify-space-between align-center">
                      <v-card-title class="text-h6 font-weight-bold pa-0">
                        {{ table.name }}
                      </v-card-title>
                      <v-chip
                        :color="isTableAvailable(table) ? 'success' : 'error'"
                        size="small"
                        class="font-weight-medium text-caption"
                        variant="elevated"
                      >
                        {{ isTableAvailable(table) ? 'Available' : 'In Use' }}
                      </v-chip>
                    </div>
                  </v-card-item>

                  <v-card-text class="text-center pa-2">
                    <!-- Selected Table View -->
                    <template v-if="isTableSelected(table.id)">
                      <div class="d-flex flex-column align-center">
                        <div class="text-subtitle-2 mb-1">Number of People</div>
                        <div class="d-flex align-center justify-center">
                          <v-btn
                            icon="mdi-minus"
                            size="small"
                            variant="text"
                            density="compact"
                            @click.stop="decrementQuantity(table.id)"
                            :disabled="getTableQuantity(table.id) <= 1"
                          >
                          </v-btn>
                          <span class="mx-2 text-h6">{{ getTableQuantity(table.id) }}</span>
                          <v-btn
                            icon="mdi-plus"
                            size="small"
                            variant="text"
                            density="compact"
                            @click.stop="incrementQuantity(table.id)"
                          >
                          </v-btn>
                        </div>
                      </div>
                    </template>

                    <!-- Occupied Table View -->
                    <template v-else-if="!isTableAvailable(table)">
                      <div class="d-flex align-center justify-center">
                        <v-icon color="error" size="small" class="mr-1">mdi-account-group</v-icon>
                        <span class="text-body-1">{{ table.quantity }} People</span>
                      </div>
                    </template>

                    <!-- Available Table View -->
                    <template v-else>
                      <div class="d-flex align-center justify-center">
                        <v-icon size="small" color="success" class="mr-1">mdi-cursor-pointer</v-icon>
                        <span class="text-body-2">Click to Select</span>
                      </div>
                    </template>
                  </v-card-text>
                </v-card>
              </v-hover>
            </v-col>
          </v-row>
        </v-container>

        <!-- Footer with Button -->
        <v-container fluid class="pa-4 pt-0">
          <v-row>
            <v-col cols="12">
              <v-btn
                block
                color="primary"
                size="large"
                :loading="processing"
                :disabled="!selectedTables.length || processing"
                @click="processOrder"
                class="text-none"
              >
                CONFIRM AND HOLD ORDER
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTableManagement } from '../../composables/useTableManagement'
import { useOrderType } from '../../composables/useOrderType'
import { usePosStore } from '../../../../stores/pos-store'
import { useCartStore } from '../../../../stores/cart-store'
import { logger } from '../../../../utils/logger'
import { OrderType } from '../../../../types/order'

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

import { useCompanyStore } from '@/stores/company'

// Store access
const posStore = usePosStore()
const cartStore = useCartStore()
const companyStore = useCompanyStore()

// Composables
const {
  loading: tableLoading,
  error,
  getTables,
  isTableOccupied,
  setTableOccupancy,
  currentCashRegister
} = useTableManagement()

// Computed properties for store and cashier state
const selectedStore = computed(() => companyStore.selectedStore)
const selectedCashier = computed(() => companyStore.selectedCashier)

// Validation computed
const canProcessOrder = computed(() => {
  const hasStore = !!selectedStore.value
  const hasCashier = !!selectedCashier.value
  const hasItems = !cartStore.isEmpty
  
  logger.debug('[DineInModal] Order prerequisites:', {
    hasStore,
    hasCashier,
    hasItems,
    selectedStore: selectedStore.value,
    selectedCashier: selectedCashier.value,
    companyStoreState: {
      store: companyStore.selectedStore,
      cashier: companyStore.selectedCashier
    }
  })
  
  return hasStore && hasCashier && hasItems
})

const {
  setOrderType,
  setCustomerInfo,
  canCreateOrder
} = useOrderType()

// Local state
const dialog = ref(false)
const loading = computed(() => tableLoading.value)
const processing = ref(false)
const tables = ref([])
const selectedTables = ref([])

// Methods
const isTableAvailable = (table) => {
  return !isTableOccupied(table.id) || isTableSelected(table.id)
}

const isTableSelected = (tableId) => {
  return selectedTables.value.some(t => t.id === tableId)
}

const getTableQuantity = (tableId) => {
  const table = selectedTables.value.find(t => t.id === tableId)
  return table ? table.quantity : 1
}

const handleTableClick = (table) => {
  if (!isTableAvailable(table)) {
    window.toastr?.['warning']('This table is currently occupied')
    return
  }

  const index = selectedTables.value.findIndex(t => t.id === table.id)
  if (index >= 0) {
    selectedTables.value.splice(index, 1)
  } else {
    selectedTables.value.push({
      id: table.id,
      name: table.name,
      quantity: 1
    })
  }
}

const incrementQuantity = (tableId) => {
  const table = selectedTables.value.find(t => t.id === tableId)
  if (table) {
    table.quantity++
  }
}

const decrementQuantity = (tableId) => {
  const table = selectedTables.value.find(t => t.id === tableId)
  if (table && table.quantity > 1) {
    table.quantity--
  }
}

const retryLoadTables = async () => {
  try {
    tables.value = await getTables()
  } catch (err) {
    logger.error('Failed to retry loading tables:', err)
    window.toastr?.['error']('Failed to load tables')
  }
}

// Process the order
const processOrder = async () => {
  if (!selectedTables.value.length || !canCreateOrder.value) {
    return
  }

  // Validate store and cashier selection
  if (!selectedStore.value || !selectedCashier.value) {
    window.toastr?.['error']('Please select both store and cashier')
    logger.warn('[DineInModal] Missing store or cashier selection', {
      store: selectedStore.value,
      cashier: selectedCashier.value
    })
    return
  }

  processing.value = true
  logger.info('[DineInModal] Processing order with store/cashier:', {
    store: selectedStore.value,
    cashier: selectedCashier.value
  })

  try {
    // Set order type
    setOrderType(OrderType.DINE_IN)

    // Prepare table information with both id and table_id fields
    const selectedTablesData = selectedTables.value.map(table => ({
      id: table.id, // Add id field for backend compatibility
      table_id: table.id,
      name: table.name,
      quantity: table.quantity,
      in_use: 1 // Mark table as occupied
    }))
    
    const tableNames = selectedTablesData.map(t => t.name).join(', ')
    const totalCustomers = selectedTablesData.reduce((sum, table) => sum + table.quantity, 0)

    // Set customer info
    setCustomerInfo({
      tableNumbers: tableNames,
      tables: selectedTablesData,
      customerCount: totalCustomers
    })

    // Set cart store information
    cartStore.setSelectedTables(selectedTablesData)
    
    // Set customer and table information in notes
    const orderInfo = {
      orderInfo: {
        customer: {
          tableNumbers: tableNames,
          customerCount: totalCustomers
        },
        tables: selectedTablesData
      }
    }

    cartStore.setNotes(JSON.stringify(orderInfo))

    // Create hold invoice data with both tables arrays
    const orderData = {
      ...cartStore.prepareHoldInvoiceData(
        selectedStore.value,
        selectedCashier.value,
        `DINE_IN_Table_${tableNames}`
      ),
      tables_selected: selectedTablesData.map(table => ({
        id: table.id,
        table_id: table.id,
        name: table.name,
        quantity: table.quantity,
        in_use: 1
      })),
      hold_tables: selectedTablesData.map(table => ({
        id: table.id,
        table_id: table.id,
        name: table.name,
        quantity: table.quantity,
        in_use: 1
      }))
    }

    try {
      // Hold the order
      await posStore.holdOrder(orderData)
      
      // Mark tables as occupied
      selectedTablesData.forEach(table => {
        setTableOccupancy(table.table_id, true)
      })

      // Refresh tables list
      await getTables()
      
      // If we get here, assume success since errors would be caught
      cartStore.clearCart()
      dialog.value = false
      window.toastr?.['success']('Dine-in order held successfully')
    } catch (holdError) {
      // Log error but continue checking if order was created
      logger.error('Hold order error:', holdError)

      // Check if the order was actually created despite the error
      await new Promise(resolve => setTimeout(resolve, 500))
      await posStore.fetchHoldInvoices()
      
      // Look for our order in the latest invoices
      const orderExists = posStore.holdInvoices.some(invoice => 
        invoice.type === OrderType.DINE_IN && 
        invoice.description?.includes(`DINE_IN_Table_${tableNames}`)
      )

      if (orderExists) {
        // Order was created successfully despite the error
        // Mark tables as occupied
        selectedTablesData.forEach(table => {
          setTableOccupancy(table.table_id, true)
        })
        // Refresh tables list
        await getTables()
        cartStore.clearCart()
        dialog.value = false
        window.toastr?.['success']('Dine-in order held successfully')
      }
    }
  } catch (err) {
    logger.error('Failed to hold dine-in order:', err)
    window.toastr?.['error']('Failed to create dine-in order')
  } finally {
    processing.value = false
  }
}

// Close modal handler
const closeModal = () => {
  if (!processing.value) {
    dialog.value = false
    selectedTables.value = []
  }
}

// Component initialization
onMounted(() => {
  logger.info('[DineInModal] Component mounted')
  
  // Initialize store asynchronously but don't block mounting
  const initializeStores = async () => {
    try {
      if (!companyStore.isInitialized) {
        logger.debug('[DineInModal] Initializing company store')
        await companyStore.initializeStore()
      }

      logger.info('[DineInModal] Store state after mount:', {
        store: selectedStore.value,
        cashier: selectedCashier.value,
        companyStore: {
          selectedStore: companyStore.selectedStore,
          selectedCashier: companyStore.selectedCashier
        }
      })
    } catch (err) {
      logger.error('[DineInModal] Initialization error:', err)
      error.value = 'Failed to initialize store selections'
    }
  }

  // Start initialization but don't await it
  initializeStores()
})

// Watch for dialog open to load tables and set order type
watch(dialog, async (newValue) => {
  if (newValue) {
    try {
      setOrderType(OrderType.DINE_IN)
      tables.value = await getTables()
    } catch (err) {
      logger.error('Failed to initialize dine-in modal:', err)
      window.toastr?.['error']('Failed to load tables')
    }
  } else {
    selectedTables.value = []
  }
})

// Expose dialog ref for parent component
defineExpose({
  dialog
})
</script>

<style scoped>
.table-grid {
  margin: 0;
}

.table-card {
  width: 100%;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  height: 200px;
  display: flex;
  flex-direction: column;
}

.table-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  transition: background-color 0.3s ease;
}

.table-card.available::before {
  background-color: rgb(var(--v-theme-success));
}

.table-card.occupied::before {
  background-color: rgb(var(--v-theme-error));
}

.table-card.selected {
  border: 2px solid rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-primary-lighten-1));
}

.table-card.selected::before {
  background-color: rgb(var(--v-theme-primary));
}

.modal-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgb(var(--v-theme-background));
}

.table-col {
  display: flex;
  justify-content: center;
}

.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
  transition: transform 0.3s ease-in-out;
}

.dialog-bottom-transition-enter-from,
.dialog-bottom-transition-leave-to {
  transform: translateY(100%);
}

@media (max-width: 600px) {
  .table-card {
    height: 180px;
  }
  
  .table-grid {
    margin: -4px;
  }
  
  .table-col {
    padding: 4px !important;
  }
}
</style>
