export class WindowManager {
  static screenChangeHandler = null
  static logger = console
  
  static async detectScreenChanges() {
    if (typeof window.getScreenDetails === 'function') {
      const screenDetails = await window.getScreenDetails()
      this.screenChangeHandler = () => {
        const currentScreens = screenDetails.screens
        const savedScreen = this.settings.screen
        
        // Check if our saved screen is still available
        const screenStillExists = currentScreens.some(s => 
          s.availLeft === savedScreen?.availLeft &&
          s.availTop === savedScreen?.availTop
        )
        
        if (!screenStillExists) {
          this.logger.info('Configured screen disconnected, resetting settings')
          this.settings.screen = null
          this.saveSettings()
        }
      }
      
      screenDetails.addEventListener('screenschange', this.screenChangeHandler)
    }
  }

  static settings = {
    position: null,
    size: null,
    screen: null
  }

  static async loadSettings() {
    const saved = localStorage.getItem('customerDisplaySettings')
    if (saved) {
      try {
        this.settings = JSON.parse(saved)
      } catch (e) {
        this.logger.warn('Failed to load display settings', e)
      }
    }
  }

  static saveSettings() {
    localStorage.setItem('customerDisplaySettings', JSON.stringify(this.settings))
  }

  static async getSecondaryScreen() {
    try {
      // Check if we have permission to access screen details
      if (typeof window.getScreenDetails === 'function') {
        // Request permission if needed
        if (window.isSecureContext && 'permissions' in navigator) {
          const permissionStatus = await navigator.permissions.query({ name: 'window-placement' })
          if (permissionStatus.state !== 'granted') {
            this.logger.warn('Window placement permission not granted, using fallback')
            return this.getFallbackScreen()
          }
        }

        const screenDetails = await window.getScreenDetails()
        const screens = screenDetails.screens
        
        // Try to find screen 2 (index 1)
        if (screens.length > 1) {
          return screens[1]
        }
        
        // Fallback to any non-primary screen
        return screens.find(s => s.availLeft !== 0 || s.availTop !== 0) || screens[0]
      }
      
      return this.getFallbackScreen()
    } catch (error) {
      this.logger.error('Error getting secondary screen:', error)
      return this.getFallbackScreen()
    }
  }

  static getFallbackScreen() {
    // Fallback for older browsers or when permissions fail
    return {
      availLeft: window.screen.availLeft > window.screen.width ? window.screen.width : 0,
      availTop: 0,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    }
  }

  static async openCustomerDisplay() {
    await this.loadSettings()
    
    try {
      // Get secondary screen dimensions
      const secondaryScreen = await this.getSecondaryScreen()
      if (!secondaryScreen) {
        throw new Error('No secondary screen found')
      }

      const { availLeft: left, availTop: top, availWidth: width, availHeight: height } = secondaryScreen

      // Open customer display window with minimal features
      const customerWindow = window.open(
        '/customer-display',
        'customerDisplay',
        `left=${left},top=${top},width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`
      )

      if (!customerWindow) {
        throw new Error('Failed to open customer display window')
      }

      // Wait for window to load
      customerWindow.addEventListener('load', async () => {
        try {
          // Check if window is still open
          if (customerWindow.closed) {
            throw new Error('Customer display window closed unexpectedly')
          }

          // Move and resize to exact screen dimensions
          try {
            customerWindow.moveTo(left, top)
            customerWindow.resizeTo(width, height)
          } catch (moveError) {
            this.logger.warn('Window move/resize failed, continuing with current dimensions:', moveError)
          }

          // Add CSS to remove any potential borders/padding
          const style = document.createElement('style')
          style.textContent = `
            html, body {
              margin: 0;
              padding: 0;
              overflow: hidden;
              width: 100vw;
              height: 100vh;
            }
            * {
              box-sizing: border-box;
            }
          `
          customerWindow.document.head.appendChild(style)

          // Wait a brief moment for styles to apply
          await new Promise(resolve => setTimeout(resolve, 100))

          // Enter fullscreen mode
          try {
            if (customerWindow.document.documentElement.requestFullscreen) {
              await customerWindow.document.documentElement.requestFullscreen()
            } else if (customerWindow.document.documentElement.webkitRequestFullscreen) {
              await customerWindow.document.documentElement.webkitRequestFullscreen()
            } else if (customerWindow.document.documentElement.mozRequestFullScreen) {
              await customerWindow.document.documentElement.mozRequestFullScreen()
            } else if (customerWindow.document.documentElement.msRequestFullscreen) {
              await customerWindow.document.documentElement.msRequestFullscreen()
            }
          } catch (fullscreenError) {
            this.logger.warn('Fullscreen request failed, continuing in windowed mode:', fullscreenError)
          }

          // Ensure full dimensions after fullscreen
          await new Promise(resolve => setTimeout(resolve, 100))
          customerWindow.resizeTo(width, height)
          customerWindow.moveTo(left, top)

          // Force full dimensions
          customerWindow.document.body.style.overflow = 'hidden'
          customerWindow.document.body.style.margin = '0'
          customerWindow.document.body.style.padding = '0'
          customerWindow.document.body.style.width = '100vw'
          customerWindow.document.body.style.height = '100vh'

          // Focus the window
          customerWindow.focus()

          // Save settings
          this.settings.position = { left, top }
          this.settings.size = { width, height }
          this.settings.screen = secondaryScreen
          this.saveSettings()

          // Handle window closing
          customerWindow.addEventListener('beforeunload', () => {
            if (customerWindow.document.fullscreenElement) {
              customerWindow.document.exitFullscreen()
            }
          })

          // Add resize handler to maintain fullscreen
          customerWindow.addEventListener('resize', () => {
            customerWindow.resizeTo(width, height)
            customerWindow.moveTo(left, top)
          })

          this.logger.info('Customer display opened successfully on secondary screen')
        } catch (error) {
          this.logger.error('Error setting up customer display:', error)
          // Fallback to basic window
          customerWindow.resizeTo(width, height)
          customerWindow.focus()
        }
      }, 500)

      return customerWindow
    } catch (error) {
      this.logger.error('Error opening customer display:', error)
      
      // Fallback to basic window on primary screen
      const fallbackWindow = window.open(
        '/customer-display',
        'customerDisplay',
        `width=${window.screen.availWidth},height=${window.screen.availHeight}`
      )
      
      if (fallbackWindow) {
        setTimeout(() => {
          try {
            fallbackWindow.resizeTo(window.screen.availWidth, window.screen.availHeight)
            if (fallbackWindow.document.documentElement.requestFullscreen) {
              fallbackWindow.document.documentElement.requestFullscreen()
            }
            fallbackWindow.focus()
          } catch (err) {
            this.logger.warn('Fallback window setup error:', err)
          }
        }, 500)
      }
      
      return fallbackWindow
    }
  }
}
