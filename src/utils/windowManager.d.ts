export {}

declare global {
  interface Window {
    getScreenDetails?: () => Promise<{
      screens: Array<{
        availLeft: number
        availTop: number
        availWidth: number
        availHeight: number
        isPrimary: boolean
      }>
      addEventListener: (type: string, callback: () => void) => void
    }>
  }
}
