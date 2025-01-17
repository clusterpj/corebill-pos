import { logger } from './logger'
import './windowManager.d.ts'

export class WindowManager {
  static screenChangeHandler = null
  static logger = logger
  
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
      // Check if we have access to screen details
      if (typeof window.getScreenDetails === 'function') {
        const screenDetails = await window.getScreenDetails()
        const screens = screenDetails.screens
        
        // Log all detected screens
        this.logger.debug('Detected screens:', screens.map((s, i) => ({
          index: i,
          left: s.availLeft,
          top: s.availTop,
          width: s.availWidth,
          height: s.availHeight,
          isPrimary: s.isPrimary
        })))

        // Try to find the first non-primary screen
        const secondaryScreen = screens.find(s => !s.isPrimary)
        
        if (secondaryScreen) {
          this.logger.info('Found secondary screen:', {
            left: secondaryScreen.availLeft,
            top: secondaryScreen.availTop,
            width: secondaryScreen.availWidth,
            height: secondaryScreen.availHeight
          })
          return secondaryScreen
        }

        // If no secondary screen found, use first screen
        this.logger.warn('No secondary screen found, using primary screen')
        return screens[0]
      }
      
      // If no screen details API, use fallback
      this.logger.info('Using fallback screen detection')
      return this.getFallbackScreen()
    } catch (error) {
      this.logger.error('Error getting secondary screen:', error)
      return this.getFallbackScreen()
    }
  }

  static getFallbackScreen() {
    // Fallback for older browsers or when permissions fail
    const isMultiScreen = window.screen.availLeft !== 0 || 
                         window.screen.availTop !== 0 ||
                         window.screen.availWidth > window.innerWidth ||
                         window.screen.availHeight > window.innerHeight

    const screenInfo = {
      availLeft: isMultiScreen ? window.screen.availLeft : 0,
      availTop: isMultiScreen ? window.screen.availTop : 0,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      isPrimary: !isMultiScreen
    }

    this.logger.debug('Fallback screen detection:', {
      isMultiScreen,
      screenInfo
    })

    return screenInfo
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

      // Open customer display window with borderless fullscreen features
      const features = [
        `left=${left}`,
        `top=${top}`,
        `width=${width}`,
        `height=${height}`,
        'menubar=no',
        'toolbar=no',
        'location=no',
        'status=no',
        'resizable=no',
        'scrollbars=no',
        'fullscreen=yes'
      ].join(',')

      logger.info('🖥️ Opening customer display window with features:', features)
      
      // Check if popups are blocked
      let customerWindow = null
      try {
        customerWindow = window.open(
          '/customer-display',
          'customerDisplay',
          features
        )
        
        if (!customerWindow || customerWindow.closed) {
          throw new Error('Popup blocked or window failed to open')
        }
      } catch (err) {
        logger.error('❌ Popup blocked or failed to open:', err)
        // Show user-friendly message
        alert('Please allow popups for this site to open the customer display')
        // Try again with reduced features
        customerWindow = window.open(
          '/customer-display',
          'customerDisplay',
          'width=800,height=600'
        )
        if (!customerWindow) {
          throw new Error('Popup blocked even after fallback attempt')
        }
      }

      // Add permission state tracking
      let hasFullscreenPermission = false
      let hasPopupPermission = true
      
      if (!customerWindow) {
        logger.error('❌ Window.open() returned null - check popup blocker settings')
        throw new Error('Window.open() returned null - popup may be blocked')
      }
      
      logger.info('✅ Window opened successfully:', {
        closed: customerWindow.closed,
        location: customerWindow.location.href
      })

      if (!customerWindow) {
        throw new Error('Failed to open customer display window')
      }

      // Wait for window to load
      customerWindow.addEventListener('load', async () => {
        try {
          // Check if window is still open
          if (customerWindow.closed) {
            this.logger.error('❌ Window closed unexpectedly before setup')
            throw new Error('Customer display window closed unexpectedly')
          }

          this.logger.info('🖥️ Window loaded successfully, starting setup...')
          this.logger.debug('📏 Target dimensions:', { left, top, width, height })

          // Ensure correct positioning and sizing
          try {
            this.logger.info('🖼️ Positioning and sizing window...')
            
            // First move to position
            customerWindow.moveTo(left, top)
            
            // Then resize to exact dimensions
            customerWindow.resizeTo(width, height)
            
            // Force update dimensions
            await new Promise(resolve => setTimeout(resolve, 100))
            customerWindow.moveTo(left, top)
            customerWindow.resizeTo(width, height)
            
            this.logger.info('✅ Window positioned and sized successfully', {
              actualLeft: customerWindow.screenX,
              actualTop: customerWindow.screenY,
              actualWidth: customerWindow.innerWidth,
              actualHeight: customerWindow.innerHeight
            })
          } catch (moveError) {
            this.logger.warn('⚠️ Window move/resize failed:', moveError)
            this.logger.debug('📐 Current window dimensions:', {
              width: customerWindow.innerWidth,
              height: customerWindow.innerHeight,
              screenX: customerWindow.screenX,
              screenY: customerWindow.screenY
            })
          }

          // Add CSS to remove any potential borders/padding
          this.logger.info('🎨 Applying borderless styles...')
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
          this.logger.info('✅ Styles applied successfully')
          this.logger.debug('🖌️ Applied styles:', style.textContent)

          // Wait a brief moment for styles to apply
          await new Promise(resolve => setTimeout(resolve, 100))

          // Enhanced permission handling
          try {
            this.logger.info('🔒 Checking fullscreen permissions...')
            
            // Check if fullscreen is available
            if (customerWindow.document.fullscreenEnabled) {
              // Request permission
              const permission = await customerWindow.document.requestFullscreen()
              if (permission) {
                hasFullscreenPermission = true
                this.logger.info('✅ Fullscreen permission granted')
              } else {
                this.logger.warn('⚠️ Fullscreen permission denied')
              }
            } else {
              this.logger.warn('⚠️ Fullscreen not enabled in document')
            }
          } catch (e) {
            this.logger.error('❌ Fullscreen permission check failed:', e)
            // Fallback to windowed mode
            customerWindow.resizeTo(width, height)
            customerWindow.moveTo(left, top)
          }

          // Add permission state logging
          this.logger.debug('Permission states:', {
            hasFullscreenPermission,
            hasPopupPermission
          })

          // Only attempt fullscreen if we have permission
          if (hasFullscreenPermission) {
            // Add fullscreen styles
            const fullscreenStyle = document.createElement('style')
            fullscreenStyle.textContent = `
              :-webkit-full-screen, :-moz-full-screen, :-ms-fullscreen, :fullscreen {
                width: 100% !important;
                height: 100% !important;
              }
            `
            customerWindow.document.head.appendChild(fullscreenStyle)
            try {
              this.logger.info('🖼️ Attempting to enter fullscreen mode...')
              
              // First try standard fullscreen API
              if (customerWindow.document.documentElement.requestFullscreen) {
                this.logger.info('🛠️ Using standard fullscreen API')
                await customerWindow.document.documentElement.requestFullscreen()
                this.logger.info('✅ Standard fullscreen successful')
              } 
              // Fallback to vendor-specific APIs
              else if (customerWindow.document.documentElement.webkitRequestFullscreen) {
                this.logger.info('🛠️ Using webkit fullscreen API')
                await customerWindow.document.documentElement.webkitRequestFullscreen()
                this.logger.info('✅ Webkit fullscreen successful')
              } else if (customerWindow.document.documentElement.mozRequestFullScreen) {
                this.logger.info('🛠️ Using moz fullscreen API')
                await customerWindow.document.documentElement.mozRequestFullScreen()
                this.logger.info('✅ Moz fullscreen successful')
              } else if (customerWindow.document.documentElement.msRequestFullscreen) {
                this.logger.info('🛠️ Using ms fullscreen API')
                await customerWindow.document.documentElement.msRequestFullscreen()
                this.logger.info('✅ MS fullscreen successful')
              } else {
                this.logger.warn('⚠️ No fullscreen API available')
              }
              
              // Ensure fullscreen dimensions
              this.logger.info('📏 Verifying fullscreen dimensions...')
              await new Promise(resolve => setTimeout(resolve, 100))
              
              this.logger.debug('📐 Before adjustment:', {
                width: customerWindow.innerWidth,
                height: customerWindow.innerHeight
              })
              
              customerWindow.resizeTo(width, height)
              customerWindow.moveTo(left, top)
              
              this.logger.debug('📐 After adjustment:', {
                width: customerWindow.innerWidth,
                height: customerWindow.innerHeight
              })
              this.logger.info('✅ Dimensions verified')
            } catch (fullscreenError) {
              this.logger.warn('Fullscreen request failed, continuing in windowed mode:', fullscreenError)
              // Ensure window is properly sized even if fullscreen failed
              customerWindow.resizeTo(width, height)
              customerWindow.moveTo(left, top)
            }
          } else {
            this.logger.warn('Fullscreen not enabled, using windowed mode')
            // Ensure window is properly sized
            customerWindow.resizeTo(width, height)
            customerWindow.moveTo(left, top)
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

          // Save settings with permission states
          this.settings.position = { left, top }
          this.settings.size = { width, height }
          this.settings.screen = secondaryScreen
          this.settings.permissions = {
            fullscreen: hasFullscreenPermission,
            popup: hasPopupPermission,
            lastChecked: new Date().toISOString()
          }
          this.saveSettings()

          // Add periodic permission checks
          const permissionCheckInterval = setInterval(() => {
            if (customerWindow.closed) {
              clearInterval(permissionCheckInterval)
              return
            }
            
            // Check if we still have fullscreen
            if (hasFullscreenPermission && !customerWindow.document.fullscreenElement) {
              logger.warn('⚠️ Lost fullscreen permission')
              hasFullscreenPermission = false
            }
          }, 5000)

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
