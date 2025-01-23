import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logger } from '@/utils/logger'

export const usePromoStore = defineStore('promo', () => {
  const promos = ref([])

  // Load promos from localStorage
  const loadPromos = () => {
    try {
      const savedPromos = localStorage.getItem('promos')
      if (savedPromos) {
        promos.value = JSON.parse(savedPromos)
      }
    } catch (error) {
      logger.error('Failed to load promos:', error)
    }
  }

  // Save promos to localStorage
  const savePromos = () => {
    try {
      localStorage.setItem('promos', JSON.stringify(promos.value))
    } catch (error) {
      logger.error('Failed to save promos:', error)
    }
  }

  // Add new promo
  const addPromo = (promo) => {
    promos.value.push(promo)
    savePromos()
  }

  // Update existing promo
  const updatePromo = (index, promo) => {
    promos.value[index] = promo
    savePromos()
  }

  // Delete promo
  const deletePromo = (index) => {
    promos.value.splice(index, 1)
    savePromos()
  }

  // Initialize store
  loadPromos()

  return {
    promos,
    addPromo,
    updatePromo,
    deletePromo
  }
})
