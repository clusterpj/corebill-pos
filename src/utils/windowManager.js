export class WindowManager {
  static async openCustomerDisplay() {
    try {
      let left = 0;
      let top = 0;
      let width = 1024;
      let height = 768;

      // Try to get screen info if API is available
      if (window.screen && typeof window.screen.getScreens === 'function') {
        const screens = await window.screen.getScreens();
        const secondaryScreen = screens[1];
        
        if (secondaryScreen) {
          left = secondaryScreen.availLeft || secondaryScreen.left || 0;
          top = secondaryScreen.availTop || secondaryScreen.top || 0;
          width = secondaryScreen.availWidth || secondaryScreen.width || 1024;
          height = secondaryScreen.availHeight || secondaryScreen.height || 768;
        }
      } else if (window.screen) {
        // Fallback to basic screen properties
        width = window.screen.width;
        height = window.screen.height;
        // Position on the right side by default
        left = width;
      }

      // Open customer display window
      const customerWindow = window.open(
        '/pos/customer-display',
        'customerDisplay',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,fullscreen=yes`
      );

      if (customerWindow) {
        customerWindow.moveTo(left, top);
        customerWindow.resizeTo(width, height);
      }

      return customerWindow;
    } catch (error) {
      console.error('Error opening customer display:', error);
      // Try basic window open as fallback
      return window.open(
        '/pos/customer-display',
        'customerDisplay',
        'menubar=no,toolbar=no,location=no,status=no,fullscreen=yes'
      );
    }
  }
}
