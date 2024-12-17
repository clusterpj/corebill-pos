// src/services/api/auth.js
import { apiClient } from './client'
import { apiConfig } from './config'

export const authApi = {
  /**
   * Authenticate user
   * @param {Object} credentials
   * @param {string} credentials.email - User email/username
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>}
   */
  async login(credentials) {
    try {
      const response = await apiClient.post(apiConfig.endpoints.auth.login, {
        username: credentials.email, // API expects username
        password: credentials.password,
        device_name: 'web' // Default device name for web client
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 422) {
        throw {
          message: 'Invalid credentials',
          details: error.response.data.errors || {}
        }
      }
      throw error
    }
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    return apiClient.post(apiConfig.endpoints.auth.logout)
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>}
   */
  async getProfile() {
    return apiClient.get(apiConfig.endpoints.auth.me)
  },

  /**
   * Get available cashiers
   * @returns {Promise<Object>}
   */
  async getAvailableCashiers() {
    const response = await apiClient.get('/v1/core-pos/cash-register/getCashRegistersUser')
    return response.data
  }
}