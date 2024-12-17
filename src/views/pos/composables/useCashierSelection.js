import { ref, computed } from 'vue'
import { useCompanyStore } from '../../../stores/company'
import { logger } from '../../../utils/logger'

export function useCashierSelection() {
  const companyStore = useCompanyStore()
  const showSelectionDialog = ref(false)
  const selectedCashier = ref(null)
  const cashierError = ref('')

  const isReadyToContinue = computed(() => {
    return companyStore.isConfigured && 
           !companyStore.loadingStores && 
           !companyStore.loading &&
           !companyStore.storeError
  })

  const handleCashierChange = async (cashierId) => {
    if (!cashierId) return
    
    try {
      cashierError.value = ''
      await companyStore.setSelectedCashier(cashierId)
      
      if (!companyStore.isConfigured) {
        cashierError.value = 'Selected cashier has incomplete configuration'
        return
      }
    } catch (err) {
      cashierError.value = err.message
      logger.error('Failed to set cashier:', err)
      throw err
    }
  }

  const initializeSelection = async () => {
    try {
      // First check if we have stored selections
      const storedCustomer = localStorage.getItem('selectedCustomer')
      const storedStore = localStorage.getItem('selectedStore')
      const storedCashier = localStorage.getItem('selectedCashier')
      
      logger.info('Stored selections:', { storedCustomer, storedStore, storedCashier })

      // Initialize company store first
      await companyStore.initializeStore()
      
      // Try to restore selections in the correct order
      if (storedCustomer) {
        try {
          await companyStore.setSelectedCustomer(Number(storedCustomer))
          logger.info('Restored customer:', storedCustomer)
          
          // After customer is set, we can restore store
          if (storedStore) {
            await companyStore.setSelectedStore(Number(storedStore))
            logger.info('Restored store:', storedStore)
          }
          
          // Finally restore cashier if available
          if (storedCashier) {
            await companyStore.setSelectedCashier(Number(storedCashier))
            logger.info('Restored cashier:', storedCashier)
            showSelectionDialog.value = false
            return
          }
        } catch (err) {
          logger.warn('Failed to restore stored selections:', err)
          // Clear invalid stored selections
          localStorage.removeItem('selectedCustomer')
          localStorage.removeItem('selectedStore')
          localStorage.removeItem('selectedCashier')
        }
      }
      
      // If we reach here, show the selection dialog
      showSelectionDialog.value = true
      logger.info('Showing cashier selection dialog: No valid stored selections')
    } catch (err) {
      logger.error('Failed to initialize cashier selection:', err)
      throw err
    }
  }

  return {
    showSelectionDialog,
    selectedCashier,
    cashierError,
    isReadyToContinue,
    handleCashierChange,
    initializeSelection
  }
}
