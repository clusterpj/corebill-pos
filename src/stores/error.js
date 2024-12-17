// src/stores/error.js
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', {
  state: () => ({
    error: null,
    errors: {},
    showError: false
  }),

  actions: {
    setError(error) {
      this.error = error
      this.showError = true

      // If we have validation errors, store them separately
      if (error.details) {
        this.errors = error.details
      }

      // Auto-hide error after 5 seconds unless it's a validation error
      if (!error.details) {
        setTimeout(() => {
          this.clearError()
        }, 5000)
      }
    },

    clearError() {
      this.error = null
      this.errors = {}
      this.showError = false
    },

    hasErrors(field) {
      return this.errors[field] !== undefined
    },

    getFieldErrors(field) {
      return this.errors[field] || []
    }
  },

  getters: {
    errorMessage: (state) => {
      if (!state.error) return null
      return state.error.message || 'An unexpected error occurred'
    },

    errorCode: (state) => {
      if (!state.error) return null
      return state.error.code
    }
  }
})