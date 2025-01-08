export class WindowManager {
  static screenChangeHandler = null
  
  static settings = {
    position: null,
    size: null,
    screen: null
  }

  static async detectScreenChanges() {
    if (typeof window.getScreenDetails === 'function') {
      const screenDetails = await window.getScreenDetails()
      this.screenChangeHandler = () => {
        const currentScreens = screenDetails.screens
        const savedScreen = this.settings.screen
        
        if (savedScreen && !currentScreens.some(s => 
          s.availLeft === savedScreen.availLeft &&
          s.availTop === savedScreen.availTop
        )) {
          console.log('Configured screen disconnected, resetting settings')
          this.settings.screen = null
          this.saveSettings()
        }
      }
      
      screenDetails.addEventListener('screenschange', this.screenChangeHandler)
    }
  }

  static async loadSettings() {
    const saved = localStorage.getItem('customerDisplaySettings')
    if (saved) {
      try {
        this.settings = JSON.parse(saved)
      } catch (e) {
        console.warn('Failed to load display settings', e)
      }
    }
  }

  static saveSettings() {
    localStorage.setItem('customerDisplaySettings', JSON.stringify(this.settings))
  }

  static async openCustomerDisplay() {
    await this.loadSettings()
    
    try {
      let targetScreen = null
      let left = 0
      let top = 0
      let width = window.screen.availWidth
      let height = window.screen.availHeight

      // Try to get screen details using modern API
      if (typeof window.getScreenDetails === 'function') {
        const screenDetails = await window.getScreenDetails()
        const screens = screenDetails.screens

        // Try to use saved screen if available
        if (this.settings.screen) {
          targetScreen = screens.find(s => 
            s.availLeft === this.settings.screen.availLeft &&
            s.availTop === this.settings.screen.availTop
          )
        }

        // If no saved screen or it's not available, find best secondary screen
        if (!targetScreen) {
          targetScreen = screens.find(s => !s.isPrimary) || screens[0]
        }

        if (targetScreen) {
          left = targetScreen.availLeft
          top = targetScreen.availTop
          width = targetScreen.availWidth
          height = targetScreen.availHeight
          this.settings.screen = {
            availLeft: targetScreen.availLeft,
            availTop: targetScreen.availTop,
            availWidth: targetScreen.availWidth,
            availHeight: targetScreen.availHeight
          }
        }
      }

      // Create the window with specific features
      const features = [
        `left=${left}`,
        `top=${top}`,
        `width=${width}`,
        `height=${height}`,
        'menubar=no',
        'toolbar=no',
        'location=no',
        'status=no',
        'resizable=yes'
      ].join(',')

      const customerWindow = window.open('/customer-display', 'customerDisplay', features)

      if (customerWindow) {
        const setupWindow = () => {
          try {
            customerWindow.addEventListener('load', async () => {
              // Force correct positioning
              customerWindow.moveTo(left, top)
              customerWindow.resizeTo(width, height)

              // Apply fullscreen styles
              const style = customerWindow.document.createElement('style')
              style.textContent = `
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                  width: 100vw !important;
                  height: 100vh !important;
                }
                * { box-sizing: border-box !important; }
              `
              customerWindow.document.head.appendChild(style)

              // Request fullscreen after a short delay
              setTimeout(async () => {
                try {
                  if (customerWindow.document.documentElement.requestFullscreen) {
                    await customerWindow.document.documentElement.requestFullscreen()
                  }
                  
                  // Double-check dimensions after fullscreen
                  customerWindow.moveTo(left, top)
                  customerWindow.resizeTo(width, height)
                } catch (err) {
                  console.warn('Fullscreen request failed:', err)
                }
              }, 100)

              // Save final position and size
              this.settings.position = { left, top }
              this.settings.size = { width, height }
              this.saveSettings()

              // Focus the window
              customerWindow.focus()
            })

            // Handle window closing
            customerWindow.addEventListener('beforeunload', () => {
              if (customerWindow.document.fullscreenElement) {
                customerWindow.document.exitFullscreen()
              }
            })
          } catch (e) {
            console.warn('Window setup error:', e)
          }
        }

        // Setup window after ensuring it's ready
        setTimeout(setupWindow, 100)
      }

      return customerWindow
    } catch (error) {
      console.error('Error opening customer display:', error)
      return null
    }
  }
}