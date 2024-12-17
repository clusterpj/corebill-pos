// src/utils/errors.js
export class ApiError extends Error {
    constructor(code, message, details = null) {
      super(message)
      this.name = 'ApiError'
      this.code = code
      this.details = details
    }
  }
  
  export class ValidationError extends Error {
    constructor(errors) {
      super('Validation failed')
      this.name = 'ValidationError'
      this.errors = errors
    }
  }