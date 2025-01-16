import { logger } from '../../utils/logger'
import { sectionApi } from '../../services/api/section-api'

// Enhanced caching system with localStorage persistence
const cache = {
  products: new Map(),
  sections: new Map(),
  CACHE_TTL: 1000 * 60 * 5, // 5 minutes
  lastFetch: null,
  STORAGE_KEY: 'pos-products-cache',
  
  // Load cache from localStorage on initialization
  init() {
    try {
      const storedCache = localStorage.getItem(this.STORAGE_KEY)
      if (storedCache) {
        const parsed = JSON.parse(storedCache)
        if (parsed.products) {
          // Convert stored products back to Map and parse the data
          this.products = new Map(Object.entries(parsed.products).map(([key, value]) => {
            return [key, {
              data: value.data,
              timestamp: value.timestamp
            }]
          }))
        }
        if (parsed.sections) {
          // Convert stored sections back to Map and parse the data
          this.sections = new Map(Object.entries(parsed.sections).map(([key, value]) => {
            return [key, {
              data: value.data,
              timestamp: value.timestamp
            }]
          }))
        }
        this.lastFetch = parsed.lastFetch
        logger.debug('[Cache] Loaded from localStorage', {
          productsSize: this.products.size,
          sectionsSize: this.sections.size,
          lastFetch: this.lastFetch
        })
      }
    } catch (error) {
      logger.error('[Cache] Failed to load from localStorage', error)
      // Clear potentially corrupted cache
      this.clear()
      localStorage.removeItem(this.STORAGE_KEY)
    }
  },
  
  // Save cache to localStorage
  persist() {
    try {
      // Convert Maps to plain objects while preserving the structure
      const cacheData = {
        products: Object.fromEntries(this.products),
        sections: Object.fromEntries(this.sections),
        lastFetch: this.lastFetch
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData))
      logger.debug('[Cache] Persisted to localStorage', {
        productsSize: this.products.size,
        sectionsSize: this.sections.size,
        lastFetch: this.lastFetch
      })
    } catch (error) {
      logger.error('[Cache] Failed to persist to localStorage', error)
      // Clear potentially corrupted cache
      this.clear()
      localStorage.removeItem(this.STORAGE_KEY)
    }
  },
  
  get(key, type = 'products') {
    const cacheMap = this[type]
    const entry = cacheMap.get(key)
    
    if (entry) {
      // Check if cache is still valid
      if (Date.now() - entry.timestamp < this.CACHE_TTL) {
        logger.debug(`[Cache] Cache hit for ${type} key: ${key}`)
        return entry.data
      }
      
      // Remove expired entry
      logger.debug(`[Cache] Cache expired for ${type} key: ${key}`)
      cacheMap.delete(key)
      this.persist()
    } else {
      logger.debug(`[Cache] Cache miss for ${type} key: ${key}`)
    }
    
    return null
  },
  
  set(key, data, type = 'products') {
    const cacheMap = this[type]
    const entry = {
      data,
      timestamp: Date.now()
    }
    
    cacheMap.set(key, entry)
    this.persist()
    
    logger.debug(`[Cache] Set cache for ${type} key: ${key}`, {
      data: data ? '[...]' : null,
      timestamp: entry.timestamp
    })
  },
  
  clear(type) {
    if (type) {
      this[type].clear()
    } else {
      this.products.clear()
      this.sections.clear()
    }
    this.persist()
  },
  
  shouldFetch() {
    if (!this.lastFetch) return true
    return Date.now() - this.lastFetch > this.CACHE_TTL
  }
}

export const createProductsModule = (state, posApi, companyStore) => {
  // Initialize cache with error handling
  try {
    cache.init()
    logger.debug('[Products] Cache initialized', {
      productsSize: cache.products.size,
      sectionsSize: cache.sections.size,
      lastFetch: cache.lastFetch
    })
  } catch (error) {
    logger.error('[Products] Cache initialization failed', error)
    // Clear potentially corrupted cache
    cache.clear()
    localStorage.removeItem(cache.STORAGE_KEY)
  }
  
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


  const getCachedSections = async () => {
    const cached = cache.get('all', 'sections')
    if (cached) {
      logger.debug('[Products] Using cached sections')
      return cached
    }
    
    logger.debug('[Products] Fetching fresh sections')
    const allSections = await sectionApi.getAllSections('all')
    cache.set('all', allSections, 'sections')
    return allSections
  }

  const getCachedProductSections = async (productId) => {
    const cached = cache.get(productId, 'sections')
    if (cached) {
      logger.debug(`[Products] Using cached sections for product ${productId}`)
      return cached
    }
    
    const sections = await sectionApi.getSectionsForItem(productId)
    cache.set(productId, sections, 'sections')
    return sections
  }

  const fetchProducts = async (page = 1, perPage = 50) => {
    if (!companyStore.isConfigured) {
      logger.warn('Company configuration incomplete, skipping products fetch')
      return
    }

    // Debug current cache state
    logger.debug('[Products] Pre-fetch cache state', {
      productsSize: cache.products.size,
      sectionsSize: cache.sections.size,
      lastFetch: cache.lastFetch,
      localStorage: localStorage.getItem(cache.STORAGE_KEY)
    })

    // Generate cache key based on current state
    const cacheKey = JSON.stringify({
      page,
      perPage,
      category: state.selectedCategory.value,
      search: state.searchQuery.value,
      store: companyStore.selectedStore
    })

    // Check if we have cached products
    if (!cache.shouldFetch()) {
      const cachedProducts = cache.get(cacheKey)
      if (cachedProducts) {
        logger.debug('[Products] Using cached products')
        state.products.value = cachedProducts.products
        state.totalItems.value = cachedProducts.totalItems
        state.currentPage.value = page
        state.itemsPerPage.value = perPage
        return
      }
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
        
        // Process products in batches with concurrency control
        const batchSize = 10
        const concurrency = 5
        const processBatch = async (batch) => {
          const results = []
          for (let i = 0; i < batch.length; i += concurrency) {
            const chunk = batch.slice(i, i + concurrency)
            const processed = await Promise.all(chunk.map(async (product) => {
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
                return product
              } catch (error) {
                logger.error(`[Products] Failed to fetch section for product ${product.id}:`, error)
                setDefaultSection(product)
                return product
              }
            }))
            results.push(...processed)
          }
          return results
        }

        // Process all batches
        const processedProducts = []
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize)
          const processed = await processBatch(batch)
          processedProducts.push(...processed)
        }
        
        // Update state and cache
        state.sectionsMap = sectionsMap
        state.products.value = processedProducts
        state.totalItems.value = response.itemTotalCount || 0
        state.currentPage.value = page
        state.itemsPerPage.value = perPage
        
        // Cache the results
        cache.set(cacheKey, {
          products: processedProducts,
          totalItems: response.itemTotalCount || 0
        })
        cache.lastFetch = Date.now()
        
        logger.info(`[Products] Loaded ${processedProducts.length} products with section information`)
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

  const clearCache = () => {
    logger.startGroup('POS Store: Clear Products Cache')
    try {
      // Clear both memory and localStorage caches
      cache.clear()
      localStorage.removeItem(cache.STORAGE_KEY)
      // Reinitialize empty cache
      cache.init()
      
      // Log detailed cache state
      logger.debug('Cache state after clear:', {
        productsSize: cache.products.size,
        sectionsSize: cache.sections.size,
        localStorage: localStorage.getItem(cache.STORAGE_KEY)
      })
      
      logger.info('Products cache cleared successfully')
      return true
    } catch (error) {
      logger.error('Failed to clear products cache', {
        error: error.message,
        stack: error.stack,
        cacheState: {
          productsSize: cache.products.size,
          sectionsSize: cache.sections.size,
          localStorage: localStorage.getItem(cache.STORAGE_KEY)
        }
      })
      throw new Error(`Failed to clear cache: ${error.message}`)
    } finally {
      logger.endGroup()
    }
  }

  return {
    fetchCategories,
    fetchProducts,
    setCategory,
    createItem,
    updateItem,
    clearCache
  }
}
