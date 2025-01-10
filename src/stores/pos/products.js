import { logger } from '../../utils/logger'
import { sectionApi } from '../../services/api/section-api'

export const createProductsModule = (state, posApi, companyStore) => {
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
    } catch (error) {
      logger.error('Failed to fetch categories', error)
      state.error.value = error.message || 'Failed to load categories'
      state.categories.value = []
    } finally {
      state.loading.value.categories = false
      logger.endGroup()
    }
  }

  // Cache for products and sections
  const productsCache = new Map()
  const sectionsCache = new Map()
  const CACHE_TTL = 1000 * 60 * 5 // 5 minutes cache

  const getCachedSections = async () => {
    const now = Date.now()
    if (sectionsCache.has('all') && now - sectionsCache.get('all').timestamp < CACHE_TTL) {
      return sectionsCache.get('all').data
    }
    
    logger.debug('[Products] Fetching all sections')
    const allSections = await sectionApi.getAllSections('all')
    sectionsCache.set('all', { data: allSections, timestamp: now })
    return allSections
  }

  const getCachedProductSections = async (productId) => {
    const now = Date.now()
    if (sectionsCache.has(productId) && now - sectionsCache.get(productId).timestamp < CACHE_TTL) {
      return sectionsCache.get(productId).data
    }
    
    const sections = await sectionApi.getSectionsForItem(productId)
    sectionsCache.set(productId, { data: sections, timestamp: now })
    return sections
  }

  const fetchProducts = async (page = 1, perPage = 50) => {
    if (!companyStore.isConfigured) {
      logger.warn('Company configuration incomplete, skipping products fetch')
      return
    }

    logger.startGroup('POS Store: Fetch Products')
    state.loading.value.products = true
    state.error.value = null
    
    try {
      // Get cached or fresh sections
      const allSections = await getCachedSections()
      const sectionsMap = {}
      allSections.forEach(section => {
        sectionsMap[section.id] = section
      })
      
      const categoryIds = state.selectedCategory.value === 'all'
        ? state.categories.value.map(c => c.item_category_id)
        : [state.selectedCategory.value]

      const params = {
        search: state.searchQuery.value,
        categories_id: categoryIds,
        avalara_bool: false,
        is_pos: 1,
        id: companyStore.selectedStore,
        limit: perPage,
        page: page,
        sku: state.searchQuery.value
      }

      logger.debug('[Products] Fetch products params:', params)
      const response = await posApi.getItems(params)
      
      if (response.items?.data) {
        const products = Array.isArray(response.items.data) ? response.items.data : []
        
        // Process products in batches
        const batchSize = 10
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize)
          await Promise.all(batch.map(async (product) => {
            try {
              const sections = await getCachedProductSections(product.id)
              
              if (sections && sections.length > 0) {
                const section = sections[0]
                if (section && section.id) {
                  Object.assign(product, {
                    section_id: section.id,
                    section_type: section.name.toUpperCase() === 'BAR' ? 'bar' : 
                                 section.name.toUpperCase() === 'KITCHEN' ? 'kitchen' : 'other',
                    section_name: section.name
                  })
                } else {
                  setDefaultSection(product)
                }
              } else {
                setDefaultSection(product)
              }
            } catch (error) {
              logger.error(`[Products] Failed to fetch section for product ${product.id}:`, error)
              setDefaultSection(product)
            }
          }))
        }
        
        state.sectionsMap = sectionsMap
        state.products.value = products
        state.totalItems.value = response.itemTotalCount || 0
        state.currentPage.value = page
        state.itemsPerPage.value = perPage
        
        logger.info(`[Products] Loaded ${products.length} products with section information`)
      } else {
        logger.warn('No products data in response', response)
        state.products.value = []
        state.totalItems.value = 0
      }
    } catch (error) {
      logger.error('Failed to fetch products', error)
      state.error.value = error.message || 'Failed to load products'
      state.products.value = []
      state.totalItems.value = 0
    } finally {
      state.loading.value.products = false
      logger.endGroup()
    }
  }

  const setDefaultSection = (product) => {
    Object.assign(product, {
      section_id: null,
      section_type: 'other',
      section_name: 'Default'
    })
    logger.debug(`[Products] Set default section for product ${product.id}`)
  }

  const setCategory = async (categoryId) => {
    state.selectedCategory.value = categoryId
    state.currentPage.value = 1
    await fetchProducts()
  }

  const createItem = async (itemData) => {
    logger.startGroup('POS Store: Create Item')
    state.loading.value.itemOperation = true
    state.error.value = null

    try {
      const response = await posApi.createItem(itemData)
      logger.info('Item created successfully:', response)
      await fetchProducts() // Refresh the list
      return response
    } catch (error) {
      logger.error('Failed to create item:', error)
      state.error.value = error.message
      throw error
    } finally {
      state.loading.value.itemOperation = false
      logger.endGroup()
    }
  }

  const updateItem = async (itemId, itemData) => {
    logger.startGroup('POS Store: Update Item')
    state.loading.value.itemOperation = true
    state.error.value = null

    try {
      const response = await posApi.updateItem(itemId, itemData)
      logger.info('Item updated successfully:', response)
      await fetchProducts() // Refresh the list
      return response
    } catch (error) {
      logger.error('Failed to update item:', error)
      state.error.value = error.message
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
