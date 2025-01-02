// src/stores/section-orders.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sectionOrderService, SectionOrder } from '@/services/section-order.service'
import { OrderStatus } from '@/types/order'
import { logger } from '@/utils/logger'
import debounce from 'lodash/debounce'

export const useSectionOrdersStore = defineStore('sectionOrders', () => {
  // State
  const orders = ref<SectionOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const cache = new Map<string, { data: SectionOrder[], timestamp: number }>()
  const CACHE_DURATION = 10000 // 10 seconds

  // Getters
  const getOrdersBySection = computed(() => (sectionType: 'kitchen' | 'bar') => {
    return orders.value.filter(order => 
      order.items?.some(item => item.section_type === sectionType)
    )
  })

  // Debounced fetch function
  const debouncedFetch = debounce(async (sectionId: number) => {
    await fetchOrdersForSection(sectionId)
  }, 1000) // 1 second debounce

  // Actions
  async function fetchOrdersForSection(sectionId: number, force = false) {
    const cacheKey = `section_${sectionId}`
    const now = Date.now()
    const cached = cache.get(cacheKey)

    if (!force && cached && (now - cached.timestamp) < CACHE_DURATION) {
      orders.value = cached.data
      return
    }

    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const sectionOrders = await sectionOrderService.getAllOrdersForSection(sectionId)
      orders.value = sectionOrders
      lastUpdated.value = new Date()

      // Update cache
      cache.set(cacheKey, {
        data: sectionOrders,
        timestamp: now
      })

      logger.debug('Orders fetched and cached', {
        count: sectionOrders.length,
        sectionId
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch orders'
      logger.error('Failed to fetch section orders', { err })
    } finally {
      loading.value = false
    }
  }

  function refreshOrders(sectionId: number) {
    return fetchOrdersForSection(sectionId, true)
  }

  return {
    // State
    orders,
    loading,
    error,
    lastUpdated,

    // Getters
    getOrdersBySection,

    // Actions
    fetchOrdersForSection,
    refreshOrders,
    debouncedFetch
  }
})

export default useSectionOrdersStore