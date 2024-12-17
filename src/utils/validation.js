// src/utils/validation.js
export const validators = {
    required: (value) => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return value !== null && value !== undefined
    },
    
    email: (value) => {
      if (!value) return true
      const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
      return regex.test(value)
    },
    
    numeric: (value) => {
      if (!value) return true
      return !isNaN(parseFloat(value)) && isFinite(value)
    },
    
    minLength: (value, min) => {
      if (!value) return true
      return String(value).length >= min
    },
    
    maxLength: (value, max) => {
      if (!value) return true
      return String(value).length <= max
    }
  }
  
  export const validateForm = (data, rules) => {
    const errors = {}
    
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field]
      const value = data[field]
      
      fieldRules.forEach(rule => {
        if (typeof rule === 'string') {
          if (!validators[rule](value)) {
            errors[field] = errors[field] || []
            errors[field].push(`Field fails ${rule} validation`)
          }
        } else if (typeof rule === 'object') {
          const [validatorName, ...params] = rule
          if (!validators[validatorName](value, ...params)) {
            errors[field] = errors[field] || []
            errors[field].push(`Field fails ${validatorName} validation`)
          }
        }
      })
    })
    
    return Object.keys(errors).length > 0 ? errors : null
  }