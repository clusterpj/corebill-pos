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
    if (typeof window.getScreenDetails === 'function') {
      const screenDetails = await window.getScreenDetails()
      const screens = screenDetails.screens
      
      // Try to find screen 2 (index 1)
      if (screens.length > 1) {
        return screens[1]
      }
      
      // Fallback to any non-primary screen
      return screens.find(s => s.availLeft !== 0 || s.availTop !== 0) || screens[0]
    }
    
    // Fallback for older browsers
    if (window.screen.isExtended) {
      return {
        availLeft: window.screen.availLeft > window.screen.width ? window.screen.availLeft : window.screen.width,
        availTop: window.screen.availTop,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      }
    }
    
    return null
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

      // Setup window after short delay to ensure it's ready
      setTimeout(async () => {
        try {
          // Move and resize to exact screen dimensions
          customerWindow.moveTo(left, top)
          customerWindow.resizeTo(width, height)

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

          // Enter fullscreen mode
          if (customerWindow.document.documentElement.requestFullscreen) {
            await customerWindow.document.documentElement.requestFullscreen()
          }

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
