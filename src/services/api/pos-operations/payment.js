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
        {
          ...data,
          // Add required fields from platform logs
          PrintReceipt: "No",
          GetReceipt: "No",
          CaptureSignature: false,
          GetExtendedData: true
        },
        {
          signal: controller.signal,
          headers: {
            'Idempotency-Key': generateIdempotencyKey(),
            // Add auth headers required by platform
            'X-Tpn': terminalSettings.tpn, // Dynamic from terminal config
            'X-Authkey': terminalSettings.auth_key // Dynamic from terminal config
          }
        }
      )

      clearTimeout(timeout)

      // Check for successful transaction first - ResultCode 1 indicates approval
      if (response.data?.GeneralResponse?.ResultCode === "1") {
        logger.info('Payment approved by terminal:', {
          transactionId: response.data?.TransactionNumber,
          batchNumber: response.data?.BatchNumber,
          amount: response.data?.Amounts?.TotalAmount
        })
        return {
          success: true,
          data: {
            ...response.data,
            // Map to existing expected fields
            payment_id: response.data.payment_id,
            gateway: 'iPOSpays'
          }
        }
      }

      // Then check legacy approval indicators
      if (response.data?.message === "Approved" || response.data?.success === true) {
        logger.info('Payment approved by terminal (legacy format):', {
          transactionId: response.data?.payment_id,
          gateway: response.data?.gateway
        })
        return {
          success: true,
          data: response.data
        }
      }

      // Handle declined transactions
      if (response.data?.success === false || response.data?.GeneralResponse?.ResultCode !== "1") {
        const declineReason = response.data.full_message || 
                             response.data.message ||
                             'Payment declined'
        
        logger.error('Platform decline:', {
          code: response.data?.code,
          reason: declineReason,
          fullResponse: response.data
        })

        throw new Error(`TERMINAL_DECLINED: ${declineReason}`)
      }

      // Validate required transaction fields
      if (!response.data?.TransactionNumber || !response.data?.BatchNumber) {
        throw new Error('Incomplete terminal response')
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      let displayMessage = 'Payment declined'
      let declineCode = 'UNKNOWN'

      // Handle direct API response format
      if (error.response?.data) {
        const responseData = error.response.data
        
        declineCode = responseData.code || 
                     responseData.GeneralResponse?.HostResponseCode || 
                     'NO_CODE'
        
        displayMessage = responseData.full_message || 
                        responseData.message || 
                        'Payment declined'

        // Special case for BLOCKED 1ST USE
        if (displayMessage.includes('BLOCKED 1ST USE')) {
          displayMessage = 'Card requires activation - first use must be at bank ATM'
          declineCode = 'CARD_ACTIVATION_REQUIRED'
        }
      }

      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        displayMessage = 'Terminal response timeout - check terminal connection';
        declineCode = 'TIMEOUT';
      }

      // Create error with normalized message
      const errorWithCode = new Error(`TERMINAL_DECLINED: ${displayMessage}`);
      errorWithCode.declineCode = declineCode;

      logger.error('Full terminal error context:', {
        declineCode,
        config: error.config,
        response: error.response?.data,
      });

      throw errorWithCode;
    } finally {
      logger.endGroup();
    }
  }
};

