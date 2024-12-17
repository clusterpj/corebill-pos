import { ref } from 'vue'

export const createPosState = () => {
  const loading = ref({
    categories: false,
    products: false,
    stores: false,
    cashiers: false,
    employees: false,
    itemOperation: false,
    holdInvoices: false,
    conversion: false,
    updating: false
  })
  const error = ref(null)
  const categories = ref([])
  const products = ref([])
  const selectedCategory = ref('all')
  const searchQuery = ref('')
  const currentPage = ref(1)
  const itemsPerPage = ref(20)
  const totalItems = ref(0)
  const stores = ref([])
  const cashiers = ref([])
  const employees = ref([])
  const holdInvoices = ref([])
  const activeOrderType = ref(null)
  const selectedTable = ref(null)
  const orderReference = ref('')
  const customerInfo = ref(null)
  const isTableMode = ref(false)
  
  // New hold invoice specific state
  const holdInvoiceSettings = ref({
    template_id: 1,
    print_settings: {
      print_pdf: false,
      is_invoice_pos: 1,
      is_pdf_pos: true
    },
    avalara_bool: false,
    banType: true,
    invoice_pbx_modify: 0,
    taxes: {},
    packages: []
  })

  return {
    loading,
    error,
    categories,
    products,
    selectedCategory,
    searchQuery,
    currentPage,
    itemsPerPage,
    totalItems,
    stores,
    cashiers,
    employees,
    holdInvoices,
    activeOrderType,
    selectedTable,
    orderReference,
    customerInfo,
    isTableMode,
    holdInvoiceSettings
  }
}
