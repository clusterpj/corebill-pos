import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/services/api/auth'
import { logger } from '@/utils/logger'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const availableCashiers = ref([])

  // Router instance
  const router = useRouter()

  // Getters
  const userPermissions = computed(() => user.value?.permissions || [])
  const isAdmin = computed(() => user.value?.role === 'admin')
  const hasCashiers = computed(() => availableCashiers.value.length > 0)

  // Actions
  async function login(credentials) {
    loading.value = true
    try {
      const response = await authApi.login(credentials)

      // API returns { type: "Bearer", token: "...", role: "super_admin" }
      const { token: authToken, role } = response

      // Set auth state
      token.value = authToken
      isAuthenticated.value = true
      user.value = {
        email: credentials.email,
        role: role,
        permissions: ['view_dashboard', 'access_pos', 'view_products', 'view_customers', 'view_reports'] // Default permissions for development
      }

      // Store token in localStorage
      localStorage.setItem('token', authToken)

      // Load full user profile first
      await loadUserProfile()

      // Navigate to select-cashier page which will handle loading cashiers
      router.push('/select-cashier')

      logger.info('User logged in successfully', { email: credentials.email })
      return response
    } catch (error) {
      logger.error('Login failed', error)
      clearAuthState()
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      logger.error('Logout failed', error)
    } finally {
      clearAuthState()
      router.push('/login')
    }
  }

  function clearAuthState() {
    user.value = null
    token.value = null
    isAuthenticated.value = false
    availableCashiers.value = []
    localStorage.removeItem('token')
  }

  async function loadUserProfile() {
    try {
      const profile = await authApi.getProfile()
      user.value = {
        ...user.value,
        ...profile
      }
    } catch (error) {
      logger.error('Failed to load user profile', error)
      throw error
    }
  }

  async function loadAvailableCashiers() {
    try {
      const response = await authApi.getAvailableCashiers()
      if (response.success && Array.isArray(response.data)) {
        availableCashiers.value = response.data
      } else {
        availableCashiers.value = []
        throw new Error('Invalid response format from server')
      }
      return response.data
    } catch (error) {
      logger.error('Failed to load available cashiers:', error)
      availableCashiers.value = []
      throw error
    }
  }

  async function restoreSession() {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      return false
    }

    try {
      token.value = storedToken
      isAuthenticated.value = true
      await Promise.all([
        loadUserProfile(),
        loadAvailableCashiers()
      ])
      return true
    } catch (error) {
      logger.error('Failed to restore session', error)
      clearAuthState()
      return false
    }
  }

  // Add hasPermission method
  function hasPermission(permission) {
    if (!user.value) return false
    return userPermissions.value.includes(permission)
  }

  return {
    // State
    user,
    token,
    isAuthenticated,
    loading,
    availableCashiers,

    // Getters
    userPermissions,
    isAdmin,
    hasCashiers,

    // Actions
    login,
    logout,
    loadUserProfile,
    loadAvailableCashiers,
    restoreSession,
    hasPermission
  }
})
