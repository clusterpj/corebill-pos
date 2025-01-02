export class WindowManager {
  static async openCustomerDisplay() {
    // Get all screens
    const screens = await window.screen.getScreens()
    
    // Find the secondary display (screen 2)
    const secondaryScreen = screens[1] || screens[0]
    
    if (!secondaryScreen) {
      console.warn('Secondary screen not found')
      return null
    }

    // Calculate center position on secondary screen
    const left = secondaryScreen.availLeft
    const top = secondaryScreen.availTop
    
    // Open new window on secondary screen
    const customerWindow = window.open(
      '/customer-display',
      'customerDisplay',
      `width=${secondaryScreen.availWidth},height=${secondaryScreen.availHeight},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    )

    if (customerWindow) {
      customerWindow.moveTo(left, top)
      customerWindow.resizeTo(secondaryScreen.availWidth, secondaryScreen.availHeight)
    }

    return customerWindow
  }
}
