import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const terminalPaymentApi = axios.create({
  baseURL: `${BASE_URL}/v2/ipos-pays`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const terminalPaymentService = {
  // Fetch terminal settings
  getTerminalSettings() {
    return terminalPaymentApi.get('/setting');
  },

  // Get specific terminal default settings
  getTerminalDefaultSettings(settingId) {
    return terminalPaymentApi.get(`/setting/${settingId}/default`);
  },

  // Process terminal payment
  processTerminalPayment(settingId, paymentData) {
    return terminalPaymentApi.post(`/setting/${settingId}/sale`, {
      ...paymentData,
      amount: Math.round(paymentData.amount * 100), // Convert to cents
    });
  },

  // Validate payment method compatibility
  validatePaymentMethod(paymentMethodId) {
    return terminalPaymentApi.get(`/payment-methods/${paymentMethodId}/validate`);
  }
};
