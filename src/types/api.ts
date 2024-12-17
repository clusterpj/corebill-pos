// src/types/api.ts
export type ApiResponse<T = any> = {
    data: T
    status: number
    message?: string
  }
  
  export type PaginatedResponse<T> = {
    data: T[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
  
  export type ErrorResponse = {
    code: string
    message: string
    details?: Record<string, string[]>
  }