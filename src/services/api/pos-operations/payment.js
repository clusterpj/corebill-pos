import apiClient from '../client'
import { logger } from '../../../utils/logger'
import { handleApiError, generateIdempotencyKey } from './utils'

export const paymentOperations = {
  async getPaymentMethods() {
    logger.startGroup('POS Operations: Get Payment Methods')
    try {
      logger.debug('Requesting payment methods')
      const response = await apiClient.post('payments/multiple/get-payment-methods')
      
      if (!response.data?.payment_methods) {
        throw new Error('Invalid payment methods response')
      }

      logger.debug('Payment methods response:', response.data)
      logger.info('Payment methods fetched successfully')
      return {
        success: true,
        data: response.data.payment_methods
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async createPayment(paymentData) {
    logger.startGroup('POS Operations: Create Payment')
    try {
      logger.debug('Creating payment with data:', paymentData)

      const idempotencyKey = generateIdempotencyKey()
      logger.debug('Generated idempotency key:', idempotencyKey)

      const response = await apiClient.post('payments/multiple/create', paymentData, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      })

      logger.debug('Payment creation response:', response.data)
      logger.info('Payment created successfully:', {
        paymentId: response.data.payment?.id,
        amount: response.data.payment?.amount
      })
      
      return {
        success: true,
        ...response.data
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async getTerminalSettings() {
    logger.startGroup('POS Operations: Get Terminal Settings')
    try {
      const response = await apiClient.get('/v2/ipos-pays/setting')
      
      if (!response.data?.data) {
        throw new Error('Invalid terminal settings response')
      }

      // Get detailed settings for each terminal
      const terminalsWithDetails = await Promise.all(
        response.data.data.map(async terminal => {
          try {
            const details = await this.getDefaultTerminalSetting(terminal.id)
            return {
              ...terminal,
              details: details.data
            }
          } catch (error) {
            logger.warn(`Failed to get details for terminal ${terminal.id}`, error)
            return terminal
          }
        })
      )

      return {
        success: true,
        data: terminalsWithDetails
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async getDefaultTerminalSetting(settingId) {
    logger.startGroup(`POS Operations: Get Default Terminal Setting for ${settingId}`)
    try {
      const response = await apiClient.get(`/v2/ipos-pays/setting/${settingId}/default`)
      
      if (!response.data) {
        throw new Error('Invalid terminal details response')
      }

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return handleApiError(error)
    } finally {
      logger.endGroup()
    }
  },

  async processTerminalPayment(settingId, data) {
    logger.startGroup(`POS Operations: Process Terminal Payment for Setting ${settingId}`)
    try {
      if (!settingId) {
        throw new Error('Missing terminal setting ID')
      }

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await apiClient.post(
        `/v2/ipos-pays/setting/${settingId}/sale`,
        data,
        {
          signal: controller.signal
        }
      )

      clearTimeout(timeout)

      if (!response.data) {
        throw new Error('Invalid terminal payment response')
      }

      // Handle specific error responses
      if (response.data.success === false) {
        const errorMessage = response.data.message || 'Terminal payment failed'
        const errorDetails = response.data.details || {}
        
        // Log detailed error information
        logger.error('Terminal payment failed:', {
          error: errorMessage,
          details: errorDetails,
          settingId,
          paymentData: data
        })

        throw new Error(errorMessage)
      }

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        logger.error('Terminal payment timeout:', {
          settingId,
          duration: '30s'
        })
        throw new Error('Terminal payment timed out. Please check terminal connection and try again.')
      }

      if (error.response) {
        // Handle HTTP errors
        const status = error.response.status
        if (status === 401) {
          throw new Error('Terminal authentication failed. Please check terminal credentials.')
        }
        if (status === 404) {
          throw new Error('Terminal not found. Please check terminal configuration.')
        }
        if (status === 500) {
          throw new Error('Terminal processing error. Please try again.')
        }
      }

      // Log and rethrow other errors
      logger.error('Terminal payment error:', {
        error: error.message,
        settingId,
        paymentData: data
      })
      throw error
    } finally {
      logger.endGroup()
    }
  }
};

