<template>
  <v-layout class="customer-display-layout">
    <template v-if="isInitialized">
      <customer-display />
    </template>
    <template v-else>
      <v-overlay
        :model-value="true"
        class="align-center justify-center"
      >
        <v-progress-circular
          size="64"
          color="primary"
          indeterminate
        />
      </v-overlay>
    </template>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '@/stores/company'
import CustomerDisplay from './components/CustomerDisplay.vue'
import { logger } from '@/utils/logger'

const router = useRouter()
const companyStore = useCompanyStore()
const isInitialized = ref(false)

async function initializeDisplay() {
  try {
    logger.startGroup('Customer Display: Initializing')
    
    // Try to initialize from stored data first
    await companyStore.initializeStore()
    
    // Check if store is properly configured
    if (!companyStore.isConfigured || !companyStore.selectedStore) {
      logger.warn('Store not properly configured, redirecting to cashier selection', {
        isConfigured: companyStore.isConfigured,
        selectedStore: companyStore.selectedStore,
        selectedCustomer: companyStore.selectedCustomer,
        selectedCashier: companyStore.selectedCashier
      })
      router.push('/select-cashier')
      return
    }

    // Double check store data is loaded
    if (companyStore.stores.length === 0) {
      logger.info('Fetching stores data...')
      await companyStore.fetchStores()
    }

    isInitialized.value = true
    logger.info('Customer display initialized successfully', {
      store: companyStore.currentStore,
      storeId: companyStore.selectedStore
    })
  } catch (error) {
    logger.error('Failed to initialize customer display:', error)
    router.push('/select-cashier')
  } finally {
    logger.endGroup()
  }
}

onMounted(async () => {
  await initializeDisplay()
})
</script>

<style scoped>
.customer-display-layout {
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
