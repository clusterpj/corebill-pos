// src/types/user.ts
export interface User {
    id: number
    name: string
    email: string
    role: string
    permissions: string[]
    settings?: UserSettings
    created_at: string
    updated_at: string
  }
  
  export interface UserSettings {
    theme: 'light' | 'dark'
    language: string
    notifications: NotificationSettings
  }
  
  export interface NotificationSettings {
    email: boolean
    push: boolean
    sms: boolean
  }