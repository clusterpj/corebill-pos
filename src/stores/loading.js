// src/stores/loading.js
import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    loadingKeys: []
  }),
  actions: {
    startLoading(keys) {
      this.loadingKeys = [...this.loadingKeys, ...keys]
    },
    stopLoading(keys) {
      if (keys) {
        this.loadingKeys = this.loadingKeys.filter(key => !keys.includes(key))
      } else {
        this.loadingKeys = []
      }
    }
  },
  getters: {
    isLoading: (state) => (key) => state.loadingKeys.includes(key)
  }
})