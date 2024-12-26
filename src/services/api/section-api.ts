import apiClient from './client'
import { logger } from '@/utils/logger'

export interface Section {
  id: number
  name: string
  type: 'kitchen' | 'bar' | 'other'
  description?: string
}

export interface SectionItem {
  id: number
  section_id: number
  name: string
  price: number
  description?: string
}

export interface SectionResponse {
  success: boolean
  message: string
  sections: Section[]
}

export const sectionApi = {
  /**
   * Retrieve all sections
   * @param limit 'all' or number
   * @returns Promise<Section[]>
   */
  async getAllSections(limit: 'all' | number = 'all'): Promise<Section[]> {
    try {
      const response = await apiClient.get<SectionResponse>('/v1/core-pos/sections', {
        params: { limit }
      })
      logger.debug('[SectionAPI] Fetched all sections:', response.data)
      return response.data?.sections || []
    } catch (error) {
      logger.error('[SectionAPI] Error fetching sections:', error)
      throw error
    }
  },

  /**
   * Get sections for a specific item
   * @param itemId 
   * @returns Promise<Section[]>
   */
  async getSectionsForItem(itemId: number): Promise<Section[]> {
    try {
      const response = await apiClient.get<SectionResponse>(`/v1/core-pos/sections/getsections/${itemId}`)
      logger.debug(`[SectionAPI] Raw response for item ${itemId}:`, response.data)
      return response.data?.sections || []
    } catch (error) {
      logger.error(`[SectionAPI] Error fetching sections for item ${itemId}:`, error)
      throw error
    }
  },

  /**
   * Get items for a specific section
   * @param sectionId 
   * @returns Promise<SectionItem[]>
   */
  async getItemsForSection(sectionId: number): Promise<SectionItem[]> {
    try {
      const response = await apiClient.get(`/v1/core-pos/sections/getitems/${sectionId}`)
      logger.debug(`[SectionAPI] Items for section ${sectionId}:`, response.data)
      return response.data?.data || []
    } catch (error) {
      logger.error(`[SectionAPI] Error fetching items for section ${sectionId}:`, error)
      throw error
    }
  }
}
