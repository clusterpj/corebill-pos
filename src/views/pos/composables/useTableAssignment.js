import { ref, computed } from 'vue'
import { useCompanyStore } from '../../../stores/company'
import { posOperations } from '../../../services/api/pos-operations'
import { logger } from '../../../utils/logger'

export function useTableAssignment() {
  const companyStore = useCompanyStore()
  const tables = ref([])
  const selectedTables = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadTables = async () => {
    if (!companyStore.selectedCashier) {
      const msg = 'No cashier selected, cannot load tables'
      logger.warn(msg)
      error.value = msg
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      logger.debug('Loading tables for cashier:', companyStore.selectedCashier)
      const response = await posOperations.getTables(companyStore.selectedCashier)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load tables')
      }

      tables.value = response.data
      logger.info('Tables loaded successfully:', {
        count: tables.value.length,
        tables: tables.value
      })
    } catch (err) {
      const errorMessage = err.message || 'Failed to load tables'
      logger.error('Failed to load tables:', {
        error: err,
        cashierId: companyStore.selectedCashier
      })
      error.value = errorMessage
      tables.value = [] // Reset tables on error
      throw err
    } finally {
      loading.value = false
    }
  }

  const addTable = (tableId, quantity = 1) => {
    try {
      const table = tables.value.find(t => t.id === tableId)
      if (!table) {
        logger.warn('Attempted to add non-existent table:', tableId)
        return
      }

      const existingIndex = selectedTables.value.findIndex(t => t.table_id === tableId)
      if (existingIndex >= 0) {
        // Update quantity if table already selected
        selectedTables.value[existingIndex].quantity = quantity
        logger.info('Updated table quantity:', { tableId, quantity })
      } else {
        // Add new table selection
        selectedTables.value.push({
          table_id: tableId,
          quantity: quantity,
          name: table.name
        })
        logger.info('Added new table:', { tableId, quantity, name: table.name })
      }
    } catch (err) {
      logger.error('Error adding table:', {
        error: err,
        tableId,
        quantity
      })
      throw err
    }
  }

  const removeTable = (tableId) => {
    try {
      const initialLength = selectedTables.value.length
      selectedTables.value = selectedTables.value.filter(t => t.table_id !== tableId)
      
      if (selectedTables.value.length < initialLength) {
        logger.info('Table removed:', tableId)
      } else {
        logger.warn('Attempted to remove non-selected table:', tableId)
      }
    } catch (err) {
      logger.error('Error removing table:', {
        error: err,
        tableId
      })
      throw err
    }
  }

  const updateTableQuantity = (tableId, quantity) => {
    try {
      const table = selectedTables.value.find(t => t.table_id === tableId)
      if (table) {
        table.quantity = quantity
        logger.info('Table quantity updated:', { tableId, quantity })
      } else {
        logger.warn('Attempted to update quantity for non-selected table:', tableId)
      }
    } catch (err) {
      logger.error('Error updating table quantity:', {
        error: err,
        tableId,
        quantity
      })
      throw err
    }
  }

  const clearTableSelection = () => {
    try {
      selectedTables.value = []
      logger.info('Table selection cleared')
    } catch (err) {
      logger.error('Error clearing table selection:', err)
      throw err
    }
  }

  const getSelectedTablesForApi = () => {
    try {
      const apiTables = selectedTables.value.map(table => {
        const tableInfo = tables.value.find(t => t.id === table.table_id)
        return {
          table_id: table.table_id,
          quantity: table.quantity,
          name: tableInfo?.name || `Table ${table.table_id}` // Added name to API payload
        }
      })
      logger.debug('Prepared tables for API:', apiTables)
      return apiTables
    } catch (err) {
      logger.error('Error preparing tables for API:', err)
      throw err
    }
  }

  // Computed property to get table details including names
  const selectedTablesWithDetails = computed(() => {
    try {
      return selectedTables.value.map(selected => {
        const tableInfo = tables.value.find(t => t.id === selected.table_id)
        return {
          ...selected,
          name: tableInfo?.name || selected.name || `Table ${selected.table_id}`
        }
      })
    } catch (err) {
      logger.error('Error computing table details:', err)
      return []
    }
  })

  return {
    // State
    tables,
    selectedTables: selectedTablesWithDetails,
    loading,
    error,

    // Methods
    loadTables,
    addTable,
    removeTable,
    updateTableQuantity,
    clearTableSelection,
    getSelectedTablesForApi
  }
}
