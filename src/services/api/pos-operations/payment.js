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

      // Add response structure validation
      if (!response.data?.success && response.data?.error) {
        const spInError = response.data.error.details?.spInResponse;
        const errorMessage = spInError?.message || 'Terminal payment failed';
        const errorCode = spInError?.code || 'SPIN_ERROR';

        logger.error('SPIn payment rejection:', {
          code: errorCode,
          message: errorMessage,
          fullResponse: response.data
        });

        throw new Error(`${errorCode}: ${errorMessage}`);
      }

      // Add transaction validation
      if (!response.data?.transaction_id) {
        throw new Error('Missing transaction ID in terminal response');
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Enhanced SPIn error handling
      let displayMessage = 'Payment declined';
      
      if (error.response?.data?.error?.details?.spInResponse) {
        const spInData = error.response.data.error.details.spInResponse;
        displayMessage = spInData.decline_reason 
          ? `${spInData.message} (Reason: ${spInData.decline_reason})`
          : spInData.message;
      }
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        displayMessage = 'Terminal response timeout - check terminal connection';
      }

      logger.error('Full terminal error context:', {
        config: error.config,
        response: error.response?.data,
        stack: error.stack
      });

      throw new Error(`Terminal payment failed: ${displayMessage}`);
    } finally {
      logger.endGroup();
    }
  }
};

