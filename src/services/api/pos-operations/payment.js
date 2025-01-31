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

// Método para procesar pagos de terminales
async processTerminalPayment(settingId, data) {
  console.log(`Iniciando el procesamiento del pago del terminal para la configuración ${settingId}`);
  logger.startGroup(`POS Operations: Process Terminal Payment for Setting ${settingId}`);
  
  try {
    // Verificar si falta el ID de configuración del terminal
    if (!settingId) {
      console.error('Falta el ID de configuración del terminal');
      throw new Error('Missing terminal setting ID');
    }

    // Añadir un timeout para prevenir bloqueos
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // Timeout de 30 segundos
    console.log('Timeout configurado para 30 segundos.');

    // Get terminal settings first
    const terminalSettings = await this.getDefaultTerminalSetting(settingId);
    if (!terminalSettings.success || !terminalSettings.data) {
      throw new Error('Failed to get terminal settings');
    }

    console.log('Enviando solicitud al endpoint de la API de iPOS Pays.');
    const response = await apiClient.post(
      `/v2/ipos-pays/setting/${settingId}/sale`,
      {
        ...data,
        // Añadir campos requeridos por los registros de la plataforma
        PrintReceipt: "No",
        GetReceipt: "No",
        CaptureSignature: false,
        GetExtendedData: true
      },
      {
        signal: controller.signal,
        headers: {
          'Idempotency-Key': generateIdempotencyKey(),
          // Añadir encabezados de autenticación requeridos por la plataforma
          'X-Tpn': terminalSettings.tpn, // Dinámico desde la configuración del terminal
          'X-Authkey': terminalSettings.auth_key // Dinámico desde la configuración del terminal
        }
      }
    );
    console.log('Respuesta de la API recibida:', response);

    clearTimeout(timeout);
    console.log('Timeout limpiado.');

    // Verificar si la transacción fue exitosa - ResultCode 1 indica aprobación
    if (response.data?.GeneralResponse?.ResultCode === "1") {
      console.log('Pago aprobado por el terminal:', {
        transactionId: response.data?.TransactionNumber,
        batchNumber: response.data?.BatchNumber,
        amount: response.data?.Amounts?.TotalAmount
      });
      logger.info('Payment approved by terminal:', {
        transactionId: response.data?.TransactionNumber,
        batchNumber: response.data?.BatchNumber,
        amount: response.data?.Amounts?.TotalAmount
      });
      return {
        success: true,
        data: {
          ...response.data,
          // Mapear a los campos esperados existentes
          payment_id: response.data.payment_id,
          gateway: 'iPOSpays'
        }
      };
    }

    // Luego verificar los indicadores de aprobación heredados
    if (response.data?.message === "Approved" || response.data?.success === true) {
      console.log('Pago aprobado por el terminal (formato heredado):', {
        transactionId: response.data?.payment_id,
        gateway: response.data?.gateway
      });
      logger.info('Payment approved by terminal (legacy format):', {
        transactionId: response.data?.payment_id,
        gateway: response.data?.gateway
      });
      return {
        success: true,
        data: response.data
      };
    }

    // Manejar transacciones rechazadas
    if (response.data?.success === false || response.data?.GeneralResponse?.ResultCode !== "1") {
      const declineReason = response.data.full_message || 
                           response.data.message ||
                           'Payment declined';
      
      console.error('Rechazo de plataforma:', {
        code: response.data?.code,
        reason: declineReason,
        fullResponse: response.data
      });
      logger.error('Platform decline:', {
        code: response.data?.code,
        reason: declineReason,
        fullResponse: response.data
      });

      throw new Error(`TERMINAL_DECLINED: ${declineReason}`);
    }

    // Validar campos requeridos de la transacción
    if (!response.data?.TransactionNumber || !response.data?.BatchNumber) {
      console.error('Respuesta incompleta del terminal');
      throw new Error('Incomplete terminal response');
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al procesar el pago del terminal:', error);
    let displayMessage = 'Payment declined';
    let declineCode = 'UNKNOWN';

    // Manejar el formato directo de respuesta de la API
    if (error.response?.data) {
      const responseData = error.response.data;
      
      declineCode = responseData.code || 
                   responseData.GeneralResponse?.HostResponseCode || 
                   'NO_CODE';
      
      displayMessage = responseData.full_message || 
                      responseData.message || 
                      'Payment declined';

      // Caso especial para BLOQUEADO PRIMER USO
      if (displayMessage.includes('BLOCKED 1ST USE')) {
        displayMessage = 'Card requires activation - first use must be at bank ATM';
        declineCode = 'CARD_ACTIVATION_REQUIRED';
      }
    }

    // Manejar timeout específicamente
    if (error.code === 'ECONNABORTED') {
      displayMessage = 'Terminal response timeout - check terminal connection';
      declineCode = 'TIMEOUT';
    }

    // Crear error con mensaje normalizado
    const errorWithCode = new Error(`TERMINAL_DECLINED: ${displayMessage}`);
    errorWithCode.declineCode = declineCode;

    console.error('Contexto completo del error del terminal:', {
      declineCode,
      config: error.config,
      response: error.response?.data,
    });
    logger.error('Full terminal error context:', {
      declineCode,
      config: error.config,
      response: error.response?.data,
    });

    throw errorWithCode;
  } finally {
    console.log('Finalizando el grupo de operaciones POS.');
    logger.endGroup();
  }
}
};

