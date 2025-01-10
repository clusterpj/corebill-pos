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
          this.products = new Map(Object.entries(parsed.products))
        }
        if (parsed.sections) {
          this.sections = new Map(Object.entries(parsed.sections))
        }
        this.lastFetch = parsed.lastFetch
        logger.debug('[Cache] Loaded from localStorage')
      }
    } catch (error) {
      logger.error('[Cache] Failed to load from localStorage', error)
    }
  },
  
  // Save cache to localStorage
  persist() {
    try {
      const cacheData = {
        products: Object.fromEntries(this.products),
        sections: Object.fromEntries(this.sections),
        lastFetch: this.lastFetch
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData))
      logger.debug('[Cache] Persisted to localStorage')
    } catch (error) {
      logger.error('[Cache] Failed to persist to localStorage', error)
    }
  },
  
  get(key, type = 'products') {
    const cacheMap = this[type]
    const entry = cacheMap.get(key)
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return entry.data
    }
    // Remove expired entry
    if (entry) {
      cacheMap.delete(key)
      this.persist()
    }
    return null
  },
  
  set(key, data, type = 'products') {
    const cacheMap = this[type]
    cacheMap.set(key, {
      data,
      timestamp: Date.now()
    })
    this.persist()
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
  // Initialize cache
  cache.init()
  
  // Preload all products in the background
  const preloadAllProducts = async () => {
    if (!companyStore.isConfigured) return
    
    logger.startGroup('POS Store: Preloading All Products')
    try {
      const params = {
        avalara_bool: false,
        is_pos: 1,
        id: companyStore.selectedStore,
        limit: 1000, // Load more products initially
        page: 1
      }

      const response = await posApi.getItems(params)
      
      if (response.items?.data) {
        const products = Array.isArray(response.items.data) ? response.items.data : []
        
        // Cache all products with a special key
        cache.set('all_products', {
          products,
          timestamp: Date.now()
        })
        
        logger.info(`[Preload] Cached ${products.length} products`)
      }
    } catch (error) {
      logger.error('[Preload] Failed to preload products', error)
    } finally {
      logger.endGroup()
    }
  }

  const fetchCategories = async () => {
    // Start preloading products in the background
    preloadAllProducts()
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

    // First check if we have preloaded all products
    const preloaded = cache.get('all_products')
    if (preloaded && !cache.shouldFetch()) {
      // Filter preloaded products by current category/search
      const categoryIds = state.selectedCategory.value === 'all'
        ? state.categories.value.map(c => c.item_category_id)
        : [state.selectedCategory.value]
      
      const filteredProducts = preloaded.products.filter(product => {
        const matchesCategory = categoryIds.includes(product.category_id)
        const matchesSearch = state.searchQuery.value 
          ? product.name.toLowerCase().includes(state.searchQuery.value.toLowerCase())
          : true
        return matchesCategory && matchesSearch
      })
      
      // Paginate the filtered results
      const startIndex = (page - 1) * perPage
      const paginatedProducts = filteredProducts.slice(startIndex, startIndex + perPage)
      
      logger.debug('[Products] Using preloaded products')
      state.products.value = paginatedProducts
      state.totalItems.value = filteredProducts.length
      state.currentPage.value = page
      state.itemsPerPage.value = perPage
      return
    }

    // Fallback to regular fetch if no preloaded data
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

  return {
    fetchCategories,
    fetchProducts,
    setCategory,
    createItem,
    updateItem,
    preloadAllProducts
  }
}
