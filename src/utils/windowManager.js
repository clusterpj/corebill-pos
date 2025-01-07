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
              break
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

      // Open customer display window with specific position and size
      const customerWindow = window.open(
        '/customer-display',
        'customerDisplay',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
      );

      if (customerWindow) {
        // Force window position and size
        const setupWindow = () => {
          try {
            customerWindow.moveTo(left, top)
            customerWindow.resizeTo(width, height)
            
            // Save new position/size
            this.settings.position = { left, top }
            this.settings.size = { width, height }
            this.saveSettings()
            
            // Try to focus the window
            customerWindow.focus()
            
            // Add event listeners for manual moves/resizes
            customerWindow.addEventListener('resize', () => {
              this.settings.size = {
                width: customerWindow.innerWidth,
                height: customerWindow.innerHeight
              }
              this.saveSettings()
            })
            
            customerWindow.addEventListener('move', () => {
              this.settings.position = {
                left: customerWindow.screenX,
                top: customerWindow.screenY
              }
              this.saveSettings()
            })
          } catch (e) {
            console.warn('Could not position window:', e)
          }
        }

        // Try immediately, then again after short delay
        setupWindow()
        setTimeout(setupWindow, 100)
      }

      return customerWindow;
    } catch (error) {
      console.error('Error opening customer display:', error);
      // Fallback to basic window open
      const fallbackWindow = window.open(
        '/customer-display',
        'customerDisplay',
        'menubar=no,toolbar=no,location=no,status=no,fullscreen=yes'
      );
      
      if (fallbackWindow && window.screen) {
        // Try to position on second screen
        setTimeout(() => {
          fallbackWindow.moveTo(window.screen.width, 0);
          fallbackWindow.resizeTo(window.screen.width, window.screen.height);
          fallbackWindow.focus();
        }, 100);
      }
      
      return fallbackWindow;
    }
  }
}
