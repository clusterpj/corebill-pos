import { ref } from 'vue'
import { usePosOperations } from '../../../services/api/pos-operations'
import { logger } from '../../../utils/logger'
import paymentOperations from './payment.js'

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
  
  const createPayment = async (invoice, payments) => {
    console.log('Creating payment for invoice:', invoice.invoice.due_amount)
    loading.value = true
    error.value = null

    try {
      // Ensure we have settings
      if (!settings.value) {
        await fetchSettings()
      }

      // Get next payment number
      const nextNumberResponse = await posOperations.getNextNumber('payment')
      if (!nextNumberResponse?.nextNumber || !nextNumberResponse?.prefix) {
        throw new Error('Failed to get next payment number')
      }

      // Validate payments
      for (const payment of payments) {
        // Validate cash payments have received amount
        const method = paymentMethods.value.find(m => m.id === payment.method_id)
        if (method?.only_cash === 1 && !payment.received) {
          throw new Error(`Received amount is required for ${method.name}`)
        }

        // Calculate and validate fees if active
        if (method?.IsPaymentFeeActive === 'YES') {
          payment.fees = calculateFees(payment.method_id, payment.amount)
        }
      }

      // Calculate total payment amount including fees
      console.log('Payments:', payments)
      const totalPayment = payments.reduce((sum, payment) => sum + payment.amount, 0)
//      const totalFees = payments.reduce((sum, payment) => sum + (payment.fees || 0), 0)

      // Validate full payment is made
      console.log('Total payment:', totalPayment)
      console.log('Invoice total:', invoice.total)
      if (totalPayment !== invoice.invoice.due_amount) {
        throw new Error('Full payment is required.')
      }

      // Format payment data according to API requirements
      const paymentData = {
        amount: totalPayment, // Amount already in backend format
        invoice_id: invoice.invoice.id,
        is_multiple: 1,
        payment_date: new Date().toISOString().split('T')[0],
        paymentNumAttribute: nextNumberResponse.nextNumber,
        paymentPrefix: nextNumberResponse.prefix,
        payment_number: `${nextNumberResponse.prefix}-${nextNumberResponse.nextNumber}`,
        payment_methods: payments.map(payment => {
          const method = getPaymentMethod(payment.method_id)
          return {
            id: payment.method_id,
            name: method.name,
            amount: payment.amount, // Amount already in backend format
            received: payment.received || 0, // Amount already in backend format
            returned: payment.returned || 0, // Amount already in backend format
            valid: true
          }
        }),
        status: { value: "Approved", text: "Approved" },
        user_id: invoice.invoice.user_id,
        notes: `Payment for invoice ${invoice.invoice.invoice_number}`
      }

      // Create payment using the correct endpoint
      const response = await posOperations.createPayment(paymentData)
      
      if (!response?.success) {
        throw new Error('Failed to create payment')
      }

      return response.payment
    } catch (err) {
      error.value = err.message
      logger.error('Failed to create payment:', err)
      throw err
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
