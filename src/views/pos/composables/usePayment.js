import { ref } from 'vue'
import { usePosOperations } from '../../../services/api/pos-operations'
import { logger } from '../../../utils/logger'
import { paymentOperations } from '../../../services/api/pos-operations/payment'

export function usePayment() {
  const loading = ref(false)
  const paymentMethods = ref([])
  const error = ref(null)
  const settings = ref(null)
  const posOperations = usePosOperations()

  /**
   * Fetch company settings
   */
  const fetchSettings = async () => {
    try {
      const response = await posOperations.getCompanySettings()
      settings.value = response
      return response
    } catch (err) {
      error.value = err.message
      logger.error('Failed to fetch company settings:', err)
      throw err
    }
  }

  /**
   * Fetch available payment methods for POS
   */
  const fetchPaymentMethods = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await posOperations.getPaymentMethods()
      if (response.success && response.data) {
        paymentMethods.value = response.data
      } else {
        throw new Error('Failed to fetch payment methods')
      }
      return response.data
    } catch (err) {
      error.value = err.message
      logger.error('Failed to fetch payment methods:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchPaymentMethodsV1 = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentOperations.getPaymentMethodsV1();
      if (response.success && response.data) {
        paymentMethods.value = response.data;
      } else {
        throw new Error('Failed to fetch payment methods');
      }
      return response.data;
    } catch (err) {
      error.value = err.message;
      logger.error('Failed to fetch payment methods:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const getTerminalSettings = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentOperations.getTerminalSettings();
      if (response.success && response.data) {
        settings.value = response.data;
      } else {
        throw new Error('Failed to fetch terminal settings');
      }
      return response.data;
    } catch (err) {
      error.value = err.message;
      logger.error('Failed to fetch terminal settings:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const processPayment = async (settingId, data) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentOperations.processSale(settingId, data);
      if (!response.success) {
        throw new Error('Failed to process sale');
      }
      return response.data;
    } catch (err) {
      error.value = err.message;
      logger.error('Failed to process sale:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a payment for an invoice
   * @param {Object} invoice - The invoice object
   * @param {Array} payments - Array of payment method objects with amounts in backend format (431 for $4.31)
   */
  
  const processTerminalPayment = async (invoice, payment) => {
    const method = getPaymentMethod(payment.method_id)
    
    if (!method.settings_id) {
      throw new Error('Terminal settings ID not found')
    }

    // Get terminal settings using the imported paymentOperations
    const settingsResponse = await paymentOperations.getDefaultTerminalSetting(method.settings_id)
    if (!settingsResponse.success) {
      throw new Error('Failed to get terminal settings')
    }

    const terminalSettings = settingsResponse.data

    // Prepare payment data
    const paymentData = {
      amount: payment.amount,
      id: terminalSettings.id,
      invoice_ids: [invoice.invoice.id],
      payment_method_id: payment.method_id,
      user_id: invoice.invoice.user_id
    }

    // Process payment
    // Process payment using the imported paymentOperations
    const paymentResponse = await paymentOperations.processTerminalPayment(
      terminalSettings.id,
      paymentData
    )

    if (!paymentResponse.success) {
      throw new Error(`Terminal payment failed: ${paymentResponse.message}`)
    }

    return paymentResponse
  }

  const processRegularPayment = async (invoice, payment) => {
    try {
      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0]
      
      // Generate a unique payment number
      const paymentNumber = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      // Prepare payment data with required fields
      const paymentData = {
        invoice_id: invoice.invoice.id,
        payment_method_id: payment.method_id,
        amount: payment.amount,
        received: payment.received,
        returned: payment.returned,
        fees: payment.fees || 0,
        payment_date: currentDate,
        reference_number: '', 
        notes: '', 
        user_id: invoice.invoice.user_id || 0,
        company_id: 1,
        payment_number: paymentNumber // Add payment number
      }

      // Create payment through POS operations
      const response = await posOperations.createPayment(paymentData)
      
      if (!response.success) {
        throw new Error('Failed to process regular payment')
      }

      return response
    } catch (error) {
      logger.error('Failed to process regular payment:', error)
      throw error
    }
  }

  const createPayment = async (invoice, payments) => {
    loading.value = true
    error.value = null

    try {
      // Separate terminal and regular payments
      const terminalPayments = payments.filter(p => {
        const method = getPaymentMethod(p.method_id)
        return method.add_payment_gateway === 1 && method.account_accepted === 'T'
      })

      const regularPayments = payments.filter(p => {
        const method = getPaymentMethod(p.method_id)
        return !(method.add_payment_gateway === 1 && method.account_accepted === 'T')
      })

      // Process terminal payments
      const terminalResults = await Promise.all(
        terminalPayments.map(payment => 
          processTerminalPayment(invoice, payment)
        )
      )

      // Process regular payments
      const regularResults = await Promise.all(
        regularPayments.map(payment => 
          processRegularPayment(invoice, payment)
        )
      )

      return {
        success: true,
        terminalResults,
        regularResults
      }
    } catch (error) {
      error.value = error.message
      logger.error('Failed to create payment:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if a payment method is cash only
   * @param {number} methodId - Payment method ID
   * @returns {boolean}
   */
  const isCashOnly = (methodId) => {
    const method = paymentMethods.value.find(m => m.id === methodId)
    return method?.only_cash === 1
  }

  /**
   * Get available denominations for a payment method
   * @param {number} methodId - Payment method ID
   * @returns {Array}
   */
  const getDenominations = (methodId) => {
    const method = paymentMethods.value.find(m => m.id === methodId)
    return method?.pos_money || []
  }

  /**
   * Calculate fees for a payment method
   * @param {number} methodId - Payment method ID
   * @param {number} amount - Payment amount in backend format (431 for $4.31)
   * @returns {number} Fee amount in backend format
   */
  const calculateFees = (methodId, amount) => {
    const method = paymentMethods.value.find(m => m.id === methodId)
    if (!method?.registrationdatafees) return 0

    const fees = method.registrationdatafees
    let totalFee = 0

    if (fees.type === 'FIXED') {
      totalFee = Math.round(fees.value * 100)
    } else if (fees.type === 'PERCENTAGE') {
      totalFee = Math.round((amount * fees.value) / 100)
    } else if (fees.type === 'FIXED_PLUS_PERCENTAGE') {
      const fixedFee = Math.round(fees.value.fixed * 100)
      const percentageFee = Math.round((amount * fees.value.percentage) / 100)
      totalFee = fixedFee + percentageFee
    }

    return totalFee
  }

  /**
   * Get payment method details
   * @param {number} methodId - Payment method ID
   * @returns {Object|null}
   */
  const getPaymentMethod = (methodId) => {
    return paymentMethods.value.find(m => m.id === methodId)
  }

  return {
    loading,
    error,
    paymentMethods,
    settings,
    fetchSettings,
    fetchPaymentMethods,
    createPayment,
    getDenominations,
    calculateFees,
    getPaymentMethod,
    isCashOnly
  }
}
