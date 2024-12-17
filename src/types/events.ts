// src/types/events.ts
export interface AppEvent<T = any> {
    type: string
    payload: T
    timestamp: string
    source?: string
  }
  
  export type EventHandler<T = any> = (event: AppEvent<T>) => void | Promise<void>