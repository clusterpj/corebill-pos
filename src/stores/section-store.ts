import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sectionApi, Section, SectionItem } from '@/services/api/section-api'
import { logger } from '@/utils/logger'

export const useSectionStore = defineStore('sections', () => {
  const sections = ref<Section[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sectionItems = ref<Map<number, SectionItem[]>>(new Map())
  const itemSections = ref<Map<number, Section[]>>(new Map())

  // Computed getters
  const kitchenSections = computed(() => 
    sections.value.filter(section => section.type === 'kitchen')
  )

  const barSections = computed(() => 
    sections.value.filter(section => section.type === 'bar')
  )

  // Actions
  async function fetchSections() {
    loading.value = true
    error.value = null

    try {
      sections.value = await sectionApi.getAllSections()
      logger.info('Sections loaded successfully', sections.value)
    } catch (err) {
      error.value = 'Failed to load sections'
      logger.error('Error loading sections', err)
    } finally {
      loading.value = false
    }
  }

  async function getSectionsForItem(itemId: number): Promise<Section[]> {
    try {
      // Check cache first
      if (itemSections.value.has(itemId)) {
        return itemSections.value.get(itemId) || []
      }

      const sections = await sectionApi.getSectionsForItem(itemId)
      itemSections.value.set(itemId, sections)
      return sections
    } catch (err) {
      logger.error(`Error getting sections for item ${itemId}`, err)
      return []
    }
  }

  async function getItemsForSection(sectionId: number): Promise<SectionItem[]> {
    try {
      // Check cache first
      if (sectionItems.value.has(sectionId)) {
        return sectionItems.value.get(sectionId) || []
      }

      const items = await sectionApi.getItemsForSection(sectionId)
      sectionItems.value.set(sectionId, items)
      return items
    } catch (err) {
      logger.error(`Error getting items for section ${sectionId}`, err)
      return []
    }
  }

  // Helper to get section type for an item
  async function getSectionTypeForItem(itemId: number): Promise<'kitchen' | 'bar' | 'other' | undefined> {
    const sections = await getSectionsForItem(itemId)
    return sections[0]?.type
  }

  // Helper to get section name for an item
  async function getSectionNameForItem(itemId: number): Promise<string | undefined> {
    const sections = await getSectionsForItem(itemId)
    return sections[0]?.name
  }

  return {
    sections,
    loading,
    error,
    kitchenSections,
    barSections,
    fetchSections,
    getSectionsForItem,
    getItemsForSection,
    getSectionTypeForItem,
    getSectionNameForItem
  }
})
