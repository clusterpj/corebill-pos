import { useErrorStore } from '@/stores/error'
import { logger } from './logger'

export class AppError extends Error {
  constructor(message, details = {}, type = 'ERROR') {
    super(message)
    this.name = 'AppError'
    this.details = details
    this.type = type
    this.timestamp = new Date().toISOString()
  }
}

export const errorHandler = {
  handle(error, context = '') {
    const errorStore = useErrorStore()
    
    // Transform error to AppError if it's not already
    const appError = error instanceof AppError ? error : new AppError(
      error.message || 'An unexpected error occurred',
      error.details || {},
      error.type || 'ERROR'
    )

    // Log the error
    logger.error(`Error in ${context}:`, {
      message: appError.message,
      details: appError.details,
      type: appError.type,
      stack: appError.stack
    })

    // Update error store
    errorStore.setError(appError)

    return appError
  },

  handleApi(error, context = '') {
    const errorResponse = {
      message: error.message || 'An unexpected error occurred',
      details: {},
      type: 'API_ERROR'
    }

    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorResponse.message = 'Invalid request parameters'
          errorResponse.type = 'VALIDATION_ERROR'
          break
        case 401:
          errorResponse.message = 'Authentication required'
          errorResponse.type = 'AUTH_ERROR'
          break
        case 404:
          errorResponse.message = 'Resource not found'
          errorResponse.type = 'NOT_FOUND'
          break
        case 422:
          errorResponse.message = 'Validation failed'
          errorResponse.type = 'VALIDATION_ERROR'
          errorResponse.details = error.response.data.errors || {}
          break
        default:
          errorResponse.type = 'API_ERROR'
      }
      errorResponse.statusCode = error.response.status
    }

    const appError = new AppError(
      errorResponse.message,
      errorResponse.details,
      errorResponse.type
    )

    return this.handle(appError, context)
  }
}
