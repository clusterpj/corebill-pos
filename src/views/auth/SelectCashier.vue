<!-- src/views/auth/SelectCashier.vue -->
<template>
  <div class="select-cashier-page">
    <v-container fluid class="fill-height pa-0">
      <v-row align="center" justify="center" no-gutters class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="4" xl="3" class="pa-4">
          <v-card class="select-cashier-card" elevation="2" rounded="lg">
            <!-- Header -->
            <div class="select-cashier-header">
              <div class="d-flex flex-column align-center pt-8 pb-6">
                <v-avatar
                  color="primary"
                  size="64"
                  class="mb-6"
                >
                  <v-icon
                    icon="mdi-cash-register"
                    size="32"
                    color="white"
                  />
                </v-avatar>
                <h1 class="text-h4 font-weight-bold mb-1 text-primary">
                  Welcome Back
                </h1>
                <p class="text-subtitle-1 text-primary">
                  Select your workspace to continue
                </p>
              </div>
            </div>

            <v-card-text class="px-6 pt-8 pb-4">
              <!-- Store Selection -->
              <v-select
                v-model="selectedStore"
                :items="stores"
                item-title="name"
                item-value="id"
                label="Select Store"
                :loading="loading"
                required
                variant="outlined"
                bg-color="surface"
                class="mb-4"
                :disabled="loading"
                :error-messages="storeError"
                @update:model-value="handleStoreChange"
                prepend-inner-icon="mdi-store"
                :menu-props="{ maxHeight: '300' }"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon icon="mdi-store" color="primary" class="mr-2" />
                    </template>
                    <v-list-item-subtitle v-if="item.raw.description">
                      {{ item.raw.description }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
                <template v-slot:append>
                  <v-fade-transition leave-absolute>
                    <v-icon v-if="selectedStore" icon="mdi-check-circle" color="success" />
                  </v-fade-transition>
                </template>
              </v-select>

              <!-- Cashier Selection -->
              <v-select
                v-model="selectedCashier"
                :items="filteredCashiers"
                item-title="name"
                item-value="id"
                label="Select Register"
                :loading="loading"
                required
                variant="outlined"
                bg-color="surface"
                :disabled="loading || !selectedStore"
                :error-messages="cashierError"
                prepend-inner-icon="mdi-register"
                :menu-props="{ maxHeight: '300' }"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon icon="mdi-register" color="primary" class="mr-2" />
                    </template>
                    <v-list-item-subtitle>
                      {{ item.raw.store_name }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
                <template v-slot:append>
                  <v-fade-transition leave-absolute>
                    <v-icon v-if="selectedCashier" icon="mdi-check-circle" color="success" />
                  </v-fade-transition>
                </template>
              </v-select>

              <v-expand-transition>
                <v-alert
                  v-if="error"
                  type="error"
                  variant="tonal"
                  class="mt-4"
                  closable
                  density="compact"
                  @click:close="error = null"
                >
                  <template v-slot:prepend>
                    <v-icon icon="mdi-alert-circle" />
                  </template>
                  {{ error }}
                </v-alert>
              </v-expand-transition>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
              <v-btn
                color="error"
                variant="text"
                :disabled="loading"
                @click="handleLogout"
                density="comfortable"
              >
                Sign Out
              </v-btn>
              <v-spacer />
              <v-btn
                color="primary"
                :loading="loading"
                :disabled="!isValid"
                @click="handleSelection"
                min-width="120"
              >
                Continue
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'
import { logger } from '@/utils/logger'

const router = useRouter()
const authStore = useAuthStore()
const companyStore = useCompanyStore()

const loading = ref(false)
const error = ref(null)
const wasValidated = ref(false)
const storeError = ref('')
const cashierError = ref('')
const selectedStore = ref(null)
const selectedCashier = ref(null)

// Computed properties
const stores = computed(() => {
  if (!Array.isArray(authStore.availableCashiers)) return []
  
  const uniqueStores = new Map()
  authStore.availableCashiers.forEach(cashier => {
    if (!uniqueStores.has(cashier.store_id)) {
      uniqueStores.set(cashier.store_id, {
        id: cashier.store_id,
        name: cashier.store_name || 'Unknown Store',
        description: cashier.description || ''
      })
    }
  })
  return Array.from(uniqueStores.values())
})

// Filter cashiers by selected store
const filteredCashiers = computed(() => {
  if (!selectedStore.value || !Array.isArray(authStore.availableCashiers)) return []
  return authStore.availableCashiers.filter(cashier => 
    cashier.store_id === selectedStore.value
  )
})

const isValid = computed(() => {
  return selectedStore.value && selectedCashier.value
})

function handleStoreChange(storeId) {
  selectedStore.value = storeId
  selectedCashier.value = null // Reset cashier when store changes
  storeError.value = ''
  cashierError.value = ''
  error.value = null
  wasValidated.value = false
}

async function handleSelection() {
  wasValidated.value = true
  if (!isValid.value) {
    if (!selectedStore.value) storeError.value = 'Please select a store'
    if (!selectedCashier.value) cashierError.value = 'Please select a cash register'
    return
  }
  
  loading.value = true
  try {
    const cashier = filteredCashiers.value.find(c => c.id === selectedCashier.value)
    if (!cashier) {
      throw new Error('Selected cash register not found')
    }
    
    // Initialize company store with selected cashier
    await companyStore.initializeFromCashier(cashier)
    
    // Navigate to POS
    router.push('/pos')
  } catch (err) {
    error.value = 'Failed to select cash register. Please try again.'
    logger.error('Failed to select cashier:', err)
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  authStore.logout()
}

// Load cashiers on mount
onMounted(async () => {
  loading.value = true
  try {
    await authStore.loadAvailableCashiers()
    if (!authStore.hasCashiers) {
      error.value = 'No cash registers are available. Please contact your administrator.'
    }
  } catch (err) {
    error.value = 'Failed to load cash registers. Please try again.'
    logger.error('Failed to load cashiers:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.select-cashier-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-surface));
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-cashier-card {
  width: 100%;
  max-width: 100%;
  background: white;
}

.select-cashier-header {
  background: rgb(var(--v-theme-primary-lighten-5, 237, 245, 255));
}

:deep(.v-field) {
  border-radius: 4px;
}

:deep(.v-list-item) {
  min-height: 48px;
}

:deep(.v-list-item:not(:last-child)) {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

:deep(.v-btn) {
  text-transform: none;
  font-weight: 500;
}
</style>
