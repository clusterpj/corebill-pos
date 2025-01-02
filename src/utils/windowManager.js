export class WindowManager {
  static async openCustomerDisplay() {
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
          // Find secondary screen
          const secondaryScreen = screens[1];
          if (secondaryScreen) {
            left = secondaryScreen.availLeft;
            top = secondaryScreen.availTop;
            width = secondaryScreen.availWidth;
            height = secondaryScreen.availHeight;
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

      // Open customer display window with specific position and size
      const customerWindow = window.open(
        '/customer-display',
        'customerDisplay',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,fullscreen=yes`
      );

      if (customerWindow) {
        // Force window position and size
        setTimeout(() => {
          customerWindow.moveTo(left, top);
          customerWindow.resizeTo(width, height);
          // Try to focus the window
          customerWindow.focus();
        }, 100);
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
