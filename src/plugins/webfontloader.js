// src/plugins/webfontloader.js
/**
 * Webfontloader configuration
 * See: https://github.com/typekit/webfontloader
 */
export async function loadFonts() {
    const webFontLoader = async () => {
      const WebFont = await import('webfontloader')
      WebFont.load({
        google: {
          families: ['Roboto:100,300,400,500,700,900&display=swap'],
        },
      })
    }
    webFontLoader()
  }