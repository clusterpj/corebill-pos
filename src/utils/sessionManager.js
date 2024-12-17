// src/utils/sessionManager.js
import { useAuthStore } from '@/stores/auth'
import { logger } from '@/utils/logger'

class SessionManager {
  constructor() {
    this.authStore = useAuthStore()
    this.refreshInterval = null
    this.initialized = false
  }

  async initialize() {
    if (this.initialized) return

    // Restore session if possible
    await this.authStore.restoreSession()

    // Set up event listeners
    window.addEventListener('session-expiring', this.handleSessionExpiring.bind(this))
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('focus', this.handleWindowFocus.bind(this))

    // Set up token refresh interval
    this.setupRefreshInterval()

    this.initialized = true
  }

  setupRefreshInterval() {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    // Set up new refresh interval - refresh token 5 minutes before expiry
    if (this.authStore.sessionTimeRemaining > 0) {
      const refreshTime = Math.max(
        0,
        this.authStore.sessionTimeRemaining - (5 * 60 * 1000)
      )
      
      this.refreshInterval = setInterval(async () => {
        await this.authStore.refreshToken()
      }, refreshTime)
    }
  }

  async handleSessionExpiring() {
    logger.info('Session expiring soon')
    
    // Implement your session expiring UI logic here
    // For example, show a modal warning the user
    const warningEvent = new CustomEvent('show-session-warning', {
      detail: {
        timeRemaining: this.authStore.sessionTimeRemaining
      }
    })
    window.dispatchEvent(warningEvent)
  }

  async handleOnline() {
    // When coming back online, verify session is still valid
    if (this.authStore.isAuthenticated) {
      const sessionValid = await this.authStore.refreshToken()
      if (sessionValid) {
        this.setupRefreshInterval()
      }
    }
  }

  async handleWindowFocus() {
    // When window regains focus, verify session
    if (this.authStore.isAuthenticated && 
        this.authStore.sessionTimeRemaining < (5 * 60 * 1000)) { // Less than 5 minutes remaining
      await this.authStore.refreshToken()
    }
  }

  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    
    window.removeEventListener('session-expiring', this.handleSessionExpiring)
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('focus', this.handleWindowFocus)
    
    this.initialized = false
  }
}

export const sessionManager = new SessionManager()