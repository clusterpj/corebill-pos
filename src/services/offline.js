// src/services/offline.js
export const isOffline = () => {
    return !navigator.onLine
  }
  
  export const addToSyncQueue = async (request) => {
    // Implementation for offline queue
    // This will be implemented later when we add offline support
    console.log('Request added to sync queue:', request)
  }