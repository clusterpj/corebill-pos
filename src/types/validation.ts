// src/types/validation.ts
export interface ValidationRule {
    type: string
    params?: any[]
    message?: string
  }
  
  export interface ValidationResult {
    valid: boolean
    errors?: Record<string, string[]>
  }