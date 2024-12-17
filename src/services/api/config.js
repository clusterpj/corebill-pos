const environment = import.meta.env.MODE

// Get the API URL from environment variables with fallback to environment-specific URLs
const API_URLS = {
  production: 'https://lajuanita.corebill.co/api',
  qa: 'https://lajuanita.corebill.co/api',
  development: 'https://lajuanita.corebill.co/api'
}

const getBaseUrl = () => {
  // First try to use the environment variable
  const envApiUrl = import.meta.env.VITE_API_URL
  if (envApiUrl) {
    // Remove trailing slash and version if present
    return envApiUrl.replace(/\/v1\/*$/, '').replace(/\/+$/, '')
  }
  // Fallback to environment-specific URLs
  return API_URLS[environment] || API_URLS.development
}

export const apiConfig = {
  baseURL: getBaseUrl(),
  version: 'v1',
  timeout: 30000,
  endpoints: {
    auth: {
      login: 'auth/login',
      logout: 'auth/logout',
      me: 'me',
      cashiers: '/auth/available-cashiers' // New endpoint
    },
    dashboard: {
      todaySales: 'dashboard/today-sales',
      ordersCount: 'dashboard/orders-count',
      activeCustomers: 'dashboard/active-customers',
      productsCount: 'dashboard/products-count',
      salesChart: 'dashboard/sales-chart',
      topProducts: 'dashboard/top-products'
    },
    users: 'users',
    customers: 'customers',
    // Add next-number as a root level endpoint
    nextNumber: 'next-number',
    pos: {
      items: 'items',
      categories: 'core-pos/get-item-categories',
      cashRegisters: 'core-pos/cash-register/getCashRegistersUser',
      cashHistory: 'core-pos/cash-history',
      holdInvoices: 'core-pos/hold-invoices',
      holdInvoiceDelete: 'core-pos/hold-invoice/delete', // Add specific delete endpoint
      tables: 'core-pos/table-cash-register',
      store: 'store',
      employees: 'users',
      cashiers: 'core-pos/cash-register/getCashRegistersUser',
      settings: 'company/settings',
      invoice: {
        create: 'invoices',
        get: 'invoices',
        update: 'invoices'
      },
      payment: {
        methods: 'payments/multiple/get-payment-methods',
        create: 'payments/multiple/create',
        get: 'payments'
      }
    }
  }
}

/**
 * Formats an endpoint path to include the API version
 * @param {string} endpoint - The endpoint path
 * @returns {string} The formatted endpoint URL
 */
export function getEndpointUrl(endpoint) {
  // If baseURL already includes version, don't append it again
  if (apiConfig.baseURL.includes('/v1')) {
    return `/${endpoint.replace(/^\/+|\/+$/g, '')}`
  }
  return `/${apiConfig.version}/${endpoint.replace(/^\/+|\/+$/g, '')}`
}

/**
 * Gets the endpoint path from the configuration
 * @param {string} endpointPath - Dot notation path to the endpoint (e.g., 'pos.items')
 * @returns {string} The endpoint path
 */
export function getApiEndpoint(endpointPath) {
  const parts = endpointPath.split('.')
  let config = {...apiConfig.endpoints}
  
  let current = config
  for (const part of parts) {
    if (!current[part]) {
      return endpointPath
    }
    current = current[part]
  }
  
  return current
}

export default apiConfig
