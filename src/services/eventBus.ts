class EventBusService {
  private listeners: Map<string, Set<Function>>
  private static instance: EventBusService

  private constructor() {
    this.listeners = new Map()
    this.setupStorageListener()
  }

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService()
    }
    return EventBusService.instance
  }

  private setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('event_')) {
        const eventName = event.key.replace('event_', '')
        const listeners = this.listeners.get(eventName)
        if (listeners && event.newValue) {
          const data = JSON.parse(event.newValue)
          listeners.forEach(listener => listener(data))
        }
      }
    })
  }

  public emit(eventName: string, data: any) {
    // Store the event in localStorage to trigger storage event in other windows
    localStorage.setItem(`event_${eventName}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
    
    // Also trigger local listeners
    const listeners = this.listeners.get(eventName)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  public on(eventName: string, callback: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName)?.add(callback)

    return () => {
      this.listeners.get(eventName)?.delete(callback)
    }
  }
}

export const eventBus = EventBusService.getInstance()
