import axios from 'axios'
import { apiConfig, getEndpointUrl } from './config'
import { useCompanyStore } from '@/stores/company'
import { logger } from '@/utils/logger'

// Create axios instance with default config
const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Company': '1' // Always set Company header to 1
  }
})

// Updated request interceptor with proper headers
api.interceptors.request.use(
  async (config) => {
    // Get token from storage
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Update the URL
    if (!config.url.startsWith('/')) {
      config.url = getEndpointUrl(config.url)
    }

    // Add timing info to config for response logging
    const startTime = performance.now()
    logger.debug('API Request', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      params: config.params,
      data: config.data,
      timestamp: new Date().toISOString()
    })

    config.metadata = { startTime }

    return config
  },
  (error) => {
    logger.error('API Request Error', error)
    return Promise.reject(error)
  }
)

// Updated response interceptor with proper error handling and rate limiting
api.interceptors.response.use(
  (response) => {
    // Handle rate limit headers
    const rateLimitRemaining = response.headers['x-ratelimit-remaining']
    const rateLimitReset = response.headers['x-ratelimit-reset']
    
    if (rateLimitRemaining) {
      logger.debug('Rate limit status', {
        remaining: rateLimitRemaining,
        reset: rateLimitReset
      })
    }

    // Calculate request duration
    const duration = response.config.metadata?.startTime 
      ? `${(performance.now() - response.config.metadata.startTime).toFixed(2)}ms`
      : 'unknown'

    logger.debug('API Response', {
      status: response.status,
      url: response.config.url,
      duration,
      data: response.data
    })

    return response
  },
  (error) => {
    // Handle rate limiting
    if (error.response?.status === 429) {
      logger.warn('Rate limit exceeded', {
        reset: error.response.headers['x-ratelimit-reset']
      })
      // Implement retry logic here if needed
    }

    const errorResponse = {
      success: false,
      message: error.response?.data?.message || 'An unexpected error occurred',
      code: error.response?.status || 'UNKNOWN_ERROR',
      details: error.response?.data?.details || null
    }

    logger.error('API Response Error', errorResponse)
    return Promise.reject(errorResponse)
  }
)

export const apiClient = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // New helper for paginated requests
  getPaginated: async (url, config = {}) => {
    const response = await api.get(url, config)
    return {
      data: response.data.data,
      meta: response.data.meta,
      success: true
    }
  }
}

export default apiClient
