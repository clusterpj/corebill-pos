import apiClient from './client'
import { logger } from '@/utils/logger'
import { errorHandler } from '@/utils/errorHandler'
import { SectionType } from '@/types/enums'

export interface Section {
  id: number
  name: string
  type: SectionType
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
        params: { limit },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      // Validate response is JSON
      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html>')) {
        throw new Error('Invalid response format - received HTML instead of JSON')
      }
      
      if (!response.data?.sections) {
        throw new Error('Invalid sections data in response')
      }
      
      logger.debug('[SectionAPI] Fetched all sections:', response.data.sections)
      return response.data.sections
    } catch (error) {
      logger.error('[SectionAPI] Failed to fetch sections:', error)
      throw errorHandler.handleApi(error, '[SectionAPI] getAllSections')
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
      throw errorHandler.handleApi(error, `[SectionAPI] getSectionsForItem(${itemId})`)
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
      throw errorHandler.handleApi(error, `[SectionAPI] getItemsForSection(${sectionId})`)
    }
  }
}
