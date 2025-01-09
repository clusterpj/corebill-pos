import { logger } from '@/utils/logger'
import { sectionApi } from '@/services/api/section-api'
import type { ProductsState, Product, ProductCategory } from '@/types/product'
import type { Ref } from 'vue'
import type { Section } from '@/services/api/section-api'

interface PosApi {
  getItemCategories: () => Promise<{ success: boolean; data?: ProductCategory[]; error?: string }>
  getItems: (params: any) => Promise<{ 
    items?: { 
      data: Product[] 
      itemTotalCount: number 
    } 
    itemTotalCount?: number
    error?: string 
  }>
  createItem: (data: any) => Promise<any>
  updateItem: (id: number, data: any) => Promise<any>
}

interface CompanyStore {
  isConfigured: boolean
  selectedStore: number
}

export const createProductsModule = (
  state: ProductsState,
  posApi: PosApi,
  companyStore: CompanyStore
) => {
  const fetchCategories = async () => {
    if (!companyStore.isConfigured) {
      logger.warn('Company configuration incomplete, skipping categories fetch')
      return
    }

    logger.startGroup('POS Store: Fetch Categories')
    state.loading.value.categories = true
    state.error.value = null
    
    try {
      const response = await posApi.getItemCategories()
      
      if (response.success) {
        state.categories.value = Array.isArray(response.data) ? response.data : []
        logger.info(`Loaded ${state.categories.value.length} categories`)
        
        if (state.categories.value.length > 0) {
          logger.info('Categories loaded, fetching products')
          await fetchProducts()
        } else {
          logger.warn('No categories available')
        }
      } else {
        logger.warn('Failed to load categories', response.error)
        state.categories.value = []
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load categories'
      logger.error('Failed to fetch categories', error)
      state.error.value = message
      state.categories.value = []
    } finally {
      state.loading.value.categories = false
      logger.endGroup()
    }
  }

  const fetchProducts = async () => {
    if (!companyStore.isConfigured) {
      logger.warn('Company configuration incomplete, skipping products fetch')
      return
    }

    logger.startGroup('POS Store: Fetch Products')
    state.loading.value.products = true
    state.error.value = null
    
    try {
      // First fetch all sections to have them available
      logger.debug('[Products] Fetching all sections')
      const allSections = await sectionApi.getAllSections('all')
      logger.debug('[Products] All sections:', allSections)
      
      // Create a map of section ID to section for quick lookup
      const sectionsMap: Record<number, Section> = {}
      allSections.forEach(section => {
        sectionsMap[section.id] = section
      })
      
      // Now fetch products
      const categoryIds = state.selectedCategory.value === 'all'
        ? state.categories.value.map(c => c.item_category_id)
        : [state.selectedCategory.value]

      const params = {
        search: state.searchQuery.value,
        categories_id: categoryIds,
        avalara_bool: false,
        is_pos: 1,
        id: companyStore.selectedStore,
        limit: state.itemsPerPage.value,
        page: state.currentPage.value,
        sku: state.searchQuery.value
      }

      logger.debug('[Products] Fetch products params:', params)
      const response = await posApi.getItems(params)
      
      if (response.items?.data) {
        const products = Array.isArray(response.items.data) ? response.items.data : []
        
        // Fetch section information for each product
        await Promise.all(products.map(async (product) => {
          try {
            logger.debug(`[Products] Fetching sections for product ${product.id}`)
            const sections = await sectionApi.getSectionsForItem(product.id)
            logger.debug(`[Products] Received sections for product ${product.id}:`, sections)
            
            if (sections && sections.length > 0) {
              const section = sections[0] // Get the first section
              logger.debug(`[Products] Using section for product ${product.id}:`, section)
              
              if (section && section.id) {
                // Create a new product object with section information
                Object.assign(product, {
                  section_id: section.id,
                  section_type: 'bar', // Default to 'bar' if section.name is 'BAR', otherwise 'kitchen'
                  section_name: section.name
                })
                
                // Update section type based on section name
                if (section.name.toUpperCase() === 'BAR') {
                  product.section_type = 'bar'
                } else if (section.name.toUpperCase() === 'KITCHEN') {
                  product.section_type = 'kitchen'
                }
                
                logger.debug(`[Products] Updated product ${product.id} with section:`, { 
                  id: product.id,
                  name: product.name,
                  section: {
                    id: product.section_id,
                    type: product.section_type,
                    name: product.section_name
                  }
                })
              } else {
                logger.debug(`[Products] Invalid section data for product ${product.id}`)
                setDefaultSection(product)
              }
            } else {
              logger.debug(`[Products] No sections found for product ${product.id}`)
              setDefaultSection(product)
            }
          } catch (error) {
            logger.error(`[Products] Failed to fetch section for product ${product.id}:`, error)
            setDefaultSection(product)
          }
        }))
        
        // Store the sections map in state for future use
        state.sectionsMap = sectionsMap
        
        state.products.value = products
        state.totalItems.value = response.itemTotalCount || 0
        logger.info(`[Products] Loaded ${products.length} products with section information`)
      } else {
        logger.warn('No products data in response', response)
        state.products.value = []
        state.totalItems.value = 0
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load products'
      logger.error('Failed to fetch products', error)
      state.error.value = message
      state.products.value = []
      state.totalItems.value = 0
    } finally {
      state.loading.value.products = false
      logger.endGroup()
    }
  }

  const setDefaultSection = (product: Product) => {
    Object.assign(product, {
      section_id: null,
      section_type: 'other',
      section_name: 'Default'
    })
    logger.debug(`[Products] Set default section for product ${product.id}`)
  }

  const setCategory = async (categoryId: string | number) => {
    state.selectedCategory.value = categoryId
    state.currentPage.value = 1
    await fetchProducts()
  }

  const createItem = async (itemData: any) => {
    logger.startGroup('POS Store: Create Item')
    state.loading.value.itemOperation = true
    state.error.value = null

    try {
      const response = await posApi.createItem(itemData)
      logger.info('Item created successfully:', response)
      await fetchProducts() // Refresh the list
      return response
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create item'
      logger.error('Failed to create item:', error)
      state.error.value = message
      throw error
    } finally {
      state.loading.value.itemOperation = false
      logger.endGroup()
    }
  }

  const updateItem = async (itemId: number, itemData: any) => {
    logger.startGroup('POS Store: Update Item')
    state.loading.value.itemOperation = true
    state.error.value = null

    try {
      const response = await posApi.updateItem(itemId, itemData)
      logger.info('Item updated successfully:', response)
      await fetchProducts() // Refresh the list
      return response
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update item'
      logger.error('Failed to update item:', error)
      state.error.value = message
      throw error
    } finally {
      state.loading.value.itemOperation = false
      logger.endGroup()
    }
  }

  return {
    fetchCategories,
    fetchProducts,
    setCategory,
    createItem,
    updateItem
  }
}
