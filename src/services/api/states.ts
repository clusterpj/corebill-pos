import { apiClient } from './client'

/**
 * @typedef {Object} State
 * @property {number} id
 * @property {string} code
 * @property {string} name
 * @property {string} country_code
 */

/**
 * @typedef {Object} StateResponse
 * @property {State[]} states
 */

export const statesApi = {
  /**
   * Fetches states for a given country code
   * @param {string} [countryCode='US'] - The country code to fetch states for
   * @returns {Promise<StateResponse>} The API response containing states
   */
  async getStates(countryCode = 'US') {
    try {
      const response = await apiClient.get(`/v1/states/${countryCode}`)
      return response.data
    } catch (error) {
      throw error
    }
  }
}
