export class WindowManager {
  static screenChangeHandler = null
  
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
          console.log('Configured screen disconnected, resetting settings')
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
      // Default dimensions
      let left = 0;
      let top = 0;
      let width = 1024;
      let height = 768;

      // Get all available screens
      if (window.screen) {
        // Try using modern Screen API first
        if (typeof window.getScreenDetails === 'function') {
          const screenDetails = await window.getScreenDetails();
          const screens = screenDetails.screens;
          
          // Use saved screen if available and still connected
          if (this.settings.screen) {
            const savedScreen = screens.find(s => 
              s.availLeft === this.settings.screen.availLeft &&
              s.availTop === this.settings.screen.availTop
            )
            if (savedScreen) {
              left = savedScreen.availLeft
              top = savedScreen.availTop
              width = savedScreen.availWidth
              height = savedScreen.availHeight
              this.settings.screen = savedScreen
              this.saveSettings()
              return
            }
          }

          // Find best secondary screen
          const secondaryScreen = screens.find(s => 
            s.availLeft !== 0 || s.availTop !== 0
          ) || screens[1];
          
          if (secondaryScreen) {
            left = secondaryScreen.availLeft;
            top = secondaryScreen.availTop;
            width = secondaryScreen.availWidth;
            height = secondaryScreen.availHeight;
            this.settings.screen = secondaryScreen
            this.saveSettings()
          }
        } 
        // Fallback to older APIs
        else {
          // Check if multiple monitors are detected via screen.availLeft
          if (typeof window.screen.availLeft !== 'undefined') {
            // Detect secondary monitor by checking if availLeft is greater than primary screen width
            if (window.screen.availLeft > window.screen.width) {
              left = window.screen.availLeft;
              top = window.screen.availTop;
              width = window.screen.availWidth;
              height = window.screen.availHeight;
            } else {
              // Force position to secondary screen by setting left to primary screen width
              left = window.screen.width;
              width = window.screen.availWidth;
              height = window.screen.availHeight;
            }
          }
        }
      }

      // Use saved position/size if available
      if (this.settings.position && this.settings.size) {
        left = this.settings.position.left
        top = this.settings.position.top
        width = this.settings.size.width
        height = this.settings.size.height
      }

      // Open customer display window
      const customerWindow = window.open(
        '/customer-display',
        'customerDisplay',
        `left=${left},top=${top},width=${width},height=${height}`
      );

      if (customerWindow) {
        const setupWindow = () => {
          try {
            // Wait for window to load
            customerWindow.addEventListener('load', () => {
              // Move to correct screen
              customerWindow.moveTo(left, top)
              
              // Set initial size to match screen dimensions
              customerWindow.resizeTo(width, height)
              
              // Enter fullscreen mode using the modern API
              if (customerWindow.document.documentElement.requestFullscreen) {
                customerWindow.document.documentElement.requestFullscreen()
                  .then(() => {
                    // Ensure proper scaling
                    customerWindow.document.body.style.overflow = 'hidden'
                    customerWindow.document.body.style.margin = '0'
                    customerWindow.document.body.style.padding = '0'
                    
                    // Force fullscreen dimensions
                    customerWindow.resizeTo(width, height)
                  })
                  .catch(err => {
                    console.warn('Fullscreen error:', err)
                    // Fallback to window dimensions
                    customerWindow.resizeTo(width, height)
                  })
              } else {
                // Fallback for browsers without fullscreen API
                customerWindow.resizeTo(width, height)
              }
              
              // Focus the window
              customerWindow.focus()
              
              // Save position and size
              this.settings.position = { left, top }
              this.settings.size = { width, height }
              this.saveSettings()
            })
            
            // Handle window closing
            customerWindow.addEventListener('beforeunload', () => {
              if (customerWindow.document.fullscreenElement) {
                customerWindow.document.exitFullscreen()
              }
            })
          } catch (e) {
            console.warn('Could not position window:', e)
          }
        }

        // Setup window after short delay to ensure it's ready
        setTimeout(setupWindow, 500)
      }

      return customerWindow;
    } catch (error) {
      console.error('Error opening customer display:', error);
      // Fallback to basic window
      const fallbackWindow = window.open(
        '/customer-display',
        'customerDisplay',
        `width=${window.screen.availWidth},height=${window.screen.availHeight}`
      );
      
      if (fallbackWindow) {
        setTimeout(() => {
          try {
            fallbackWindow.resizeTo(window.screen.availWidth, window.screen.availHeight)
            if (fallbackWindow.document.documentElement.requestFullscreen) {
              fallbackWindow.document.documentElement.requestFullscreen()
            }
            fallbackWindow.focus()
          } catch (err) {
            console.warn('Fallback window setup error:', err)
          }
        }, 500)
      }
      
      return fallbackWindow;
    }
  }
}
