<!-- src/components/BaseLayout.vue -->
<template>
  <v-app>
    <v-fade-transition>
      <v-btn
        v-show="!drawerBehavior.permanent"
        size="large"
        variant="elevated"
        color="primary"
        @click="toggleDrawer"
        class="menu-toggle"
      >
        <v-icon
          size="24"
          color="white"
        >
          {{ drawer ? 'mdi-close' : 'mdi-menu' }}
        </v-icon>
        
        <v-tooltip
          activator="parent"
          location="right"
          open-delay="500"
        >
          {{ drawer ? 'Close Menu' : 'Open Menu' }}
        </v-tooltip>
      </v-btn>
    </v-fade-transition>

    <v-navigation-drawer 
      v-model="drawer"
      :temporary="drawerBehavior.temporary"
      :permanent="drawerBehavior.permanent"
      class="sidebar-drawer"
      width="300"
    >
      <!-- Header Section -->
      <v-card flat class="header-section">
        <v-toolbar 
          color="primary"
          density="comfortable"
        >
          <v-toolbar-title class="text-white font-weight-medium">
            Core POS
          </v-toolbar-title>
          <template v-slot:append>
            <v-btn
              variant="text"
              icon="mdi-close"
              color="white"
              @click.stop="drawer = false"
            />
          </template>
        </v-toolbar>
      </v-card>

      <!-- Action Buttons -->
      <div class="action-buttons pa-4">
        <v-btn
          block
          color="info"
          variant="tonal"
          prepend-icon="mdi-arrow-left-circle"
          class="action-btn mb-6"
          @click="confirmGoToCorebill"
        >
          Back to Corebill
        </v-btn>

        <v-btn
          block
          color="error"
          variant="tonal"
          prepend-icon="mdi-logout"
          class="action-btn"
          @click="confirmLogout"
        >
          Logout
        </v-btn>
      </div>

      <v-divider class="my-2"></v-divider>

      <!-- Navigation Items -->
      <v-list class="px-2">
        <div v-for="item in navItems" :key="item.title" class="nav-item-container">
          <v-list-item
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.title"
            rounded="lg"
            class="mb-1 nav-item"
          />
        </div>
      </v-list>

      <v-divider class="my-4"></v-divider>

      <!-- Selection Controls Section -->
      <div class="px-4 pb-4 selections-section">
        <div class="text-h6 mb-4 font-weight-medium">Selections</div>
        <v-select
          :model-value="companyStore.selectedCustomerDisplay"
          label="Customer"
          :items="companyStore.customersForDisplay"
          :loading="companyStore.loading"
          item-title="title"
          item-value="value"
          density="comfortable"
          hide-details
          class="mb-4 selection-field"
          @update:model-value="handleCustomerChange"
          :return-object="false"
          variant="outlined"
          bg-color="surface"
        />

        <v-select
          :model-value="companyStore.selectedStoreDisplay"
          label="Store"
          :items="companyStore.storesForDisplay"
          :loading="companyStore.loadingStores"
          item-title="title"
          item-value="value"
          density="comfortable"
          hide-details
          class="mb-4 selection-field"
          :disabled="!companyStore.selectedCustomer"
          @update:model-value="handleStoreChange"
          :return-object="false"
          variant="outlined"
          bg-color="surface"
        />

        <v-select
          :model-value="companyStore.selectedCashierDisplay"
          label="Cash Register"
          :items="companyStore.cashRegistersForDisplay"
          :loading="companyStore.loadingCashRegisters"
          item-title="title"
          item-value="value"
          density="comfortable"
          hide-details
          class="selection-field"
          :disabled="!companyStore.selectedStore"
          @update:model-value="handleCashierChange"
          :return-object="false"
          variant="outlined"
          bg-color="surface"
        />
      </div>

    </v-navigation-drawer>

    <!-- Logout Confirmation Dialog -->
    <v-dialog v-model="showLogoutDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          Confirm Logout
        </v-card-title>
        
        <v-card-text class="pa-4">
          Are you sure you want to log out? Any unsaved changes will be lost.
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showLogoutDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            @click="handleLogout"
          >
            Logout
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Back to Corebill Confirmation Dialog -->
    <v-dialog v-model="showCorebillDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          Leave POS System
        </v-card-title>
        
        <v-card-text class="pa-4">
          Are you sure you want to return to Corebill? Any unsaved changes will be lost.
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showCorebillDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="info"
            variant="tonal"
            @click="goToCorebill"
          >
            Continue
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-main class="main-content pa-0" style="max-width: none; width: 100vw;">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../stores/auth'
import { useCompanyStore } from '../stores/company'
import { useRouter } from 'vue-router'
import { logger } from '../utils/logger'

const router = useRouter()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const drawer = ref(false)
const { mobile, mdAndUp } = useDisplay()

// Dialog controls
const showLogoutDialog = ref(false)
const showCorebillDialog = ref(false)

// Computed property for drawer behavior
const drawerBehavior = computed(() => ({
  temporary: mobile.value,
  permanent: mdAndUp.value && drawer.value,
}))

// Update drawer state management
const handleDrawerState = (newValue) => {
  drawer.value = newValue
  localStorage.setItem('navigationDrawer', newValue.toString())
}

// Watch for drawer changes
watch(drawer, handleDrawerState)

const navItems = computed(() => [
  {
    title: 'Point of Sale',
    icon: 'mdi-cash-register',
    to: '/pos'
  },
  {
    title: 'Items',
    icon: 'mdi-package-variant-closed',
    to: '/items'
  }
])

// Handle selection changes
const handleCustomerChange = async (value) => {
  if (!value) return

  try {
    await companyStore.setSelectedCustomer(Number(value))
    
    // Clear downstream selections
    companyStore.clearStoreSelection()
    companyStore.clearCashierSelection()
    
    // Fetch stores for new customer
    await companyStore.fetchStores()
  } catch (error) {
    console.error('Failed to handle customer change:', error)
  }
}

const handleStoreChange = async (value) => {
  if (!value) return

  try {
    await companyStore.setSelectedStore(Number(value))
    
    // Clear cashier selection
    companyStore.clearCashierSelection()
    
    // Fetch cash registers for new store
    await companyStore.fetchCashRegisters()
  } catch (error) {
    console.error('Failed to handle store change:', error)
  }
}

const handleCashierChange = async (value) => {
  if (!value) return

  try {
    await companyStore.setSelectedCashier(Number(value))
  } catch (error) {
    console.error('Failed to handle cashier change:', error)
  }
}

// Confirmation handlers
const confirmLogout = () => {
  showLogoutDialog.value = true
}

const confirmGoToCorebill = () => {
  showCorebillDialog.value = true
}

// Handle logout
const handleLogout = async () => {
  showLogoutDialog.value = false
  try {
    await authStore.logout()
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Navigate to Corebill
const goToCorebill = () => {
  showCorebillDialog.value = false
  // This is a placeholder function - replace URL with actual Corebill URL
  window.location.href = '/corebill'
}

// Toggle drawer function
const toggleDrawer = () => {
  drawer.value = !drawer.value
}

// Initialize
onMounted(async () => {
  try {
    // Initialize drawer state from localStorage
    const savedState = localStorage.getItem('navigationDrawer')
    if (savedState !== null) {
      drawer.value = savedState === 'true'
    }

    // Get stored selections
    const storedCustomer = localStorage.getItem('selectedCustomer')
    const storedStore = localStorage.getItem('selectedStore')
    const storedCashier = localStorage.getItem('selectedCashier')

    // Step 1: Fetch customers first
    await companyStore.fetchCustomers()
      .catch(error => {
        console.error('Failed to fetch customers:', error)
        throw error // Re-throw to prevent further initialization
      })

    // Step 2: Set customer if valid
    if (companyStore.customers.length > 0) {
      let customerId = null

      if (storedCustomer && companyStore.customers.find(c => c.id === Number(storedCustomer))) {
        customerId = Number(storedCustomer)
      } else if (companyStore.customersForDisplay.length === 1) {
        customerId = companyStore.customersForDisplay[0].value
      }

      if (customerId) {
        await companyStore.setSelectedCustomer(customerId)
          .catch(error => {
            console.error('Failed to set customer:', error)
            throw error
          })

        // Step 3: Fetch stores after customer is set
        await companyStore.fetchStores()
          .catch(error => {
            console.error('Failed to fetch stores:', error)
            throw error
          })

        // Step 4: Set store if valid
        if (storedStore && companyStore.stores.find(s => s.id === Number(storedStore))) {
          await companyStore.setSelectedStore(Number(storedStore))
            .catch(error => {
              console.error('Failed to set store:', error)
            })

          // Step 5: Fetch cash registers after store is set
          await companyStore.fetchCashRegisters()
            .catch(error => {
              console.error('Failed to fetch cash registers:', error)
            })

          // Step 6: Set cash register if valid
          if (storedCashier && companyStore.cashRegisters.find(r => r.id === Number(storedCashier))) {
            await companyStore.setSelectedCashier(Number(storedCashier))
              .catch(error => {
                console.error('Failed to set cash register:', error)
              })
          }
        }
      }
    }

    logger.info('Initialization completed successfully')
  } catch (error) {
    console.error('Failed to initialize:', error)
    // Optionally show error to user via toast or alert
  }
})
</script>

<style scoped>
/* Transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Sidebar styles */
.sidebar-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.header-section {
  border-radius: 0;
}

/* Action buttons */
.action-buttons {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.action-btn {
  transition: all 0.2s ease;
  text-transform: none;
  letter-spacing: 0.5px;
  font-weight: 500;
  height: 44px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Navigation styles */
.nav-item-container {
  position: relative;
}

.nav-item {
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.nav-item.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

/* Selection fields */
.selections-section {
  background-color: rgb(var(--v-theme-background));
}

.selection-field {
  transition: all 0.3s ease;
}

.selection-field:hover:not(:disabled) {
  transform: translateY(-1px);
}

:deep(.v-field) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.v-field:not(.v-field--disabled):hover) {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

:deep(.v-field--disabled) {
  opacity: 0.7;
}

/* Menu toggle button */
.menu-toggle {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 1001;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  width: 48px;
  height: 48px;
  min-width: 48px !important;
  min-height: 48px !important;
  transition: all 0.2s ease;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.menu-toggle:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transform: translateY(-2px);
}

.menu-toggle:active {
  transform: scale(0.95);
}

@media (max-width: 600px) {
  .menu-toggle {
    bottom: 88px;
    left: 12px;
    width: 44px;
    height: 44px;
    min-width: 44px !important;
    min-height: 44px !important;
  }
}

.main-content {
  height: 100vh;
  overflow: hidden;
}
</style>
