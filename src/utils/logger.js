const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  HTTP: 'http'
}

class Logger {
  constructor() {
    this.isDebug = import.meta.env.DEV
    this.groupStack = []
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (data) {
      return `${prefix} ${message}:\n${JSON.stringify(data, null, 2)}`
    }
    return `${prefix} ${message}`
  }

  startGroup(name) {
    if (this.isDebug) {
      console.group(name)
      this.groupStack.push(name)
    }
  }

  endGroup() {
    if (this.isDebug && this.groupStack.length > 0) {
      console.groupEnd()
      this.groupStack.pop()
    }
  }

  debug(message, data) {
    if (this.isDebug) {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, data))
    }
  }

  info(message, data) {
    if (this.isDebug) {
      console.info(this.formatMessage(LOG_LEVELS.INFO, message, data))
    }
  }

  warn(message, data) {
    if (this.isDebug) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message, data))
    }
  }

  error(message, data) {
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, data))
  }

  http(method, url, config = {}, response = null) {
    if (this.isDebug) {
      this.startGroup(`HTTP ${method.toUpperCase()}: ${url}`)
      
      // Log request details
      this.debug('Request Config', {
        method,
        url,
        headers: config.headers,
        params: config.params,
        data: config.data
      })

      // Log response if available
      if (response) {
        this.debug('Response Status', response.status)
        this.debug('Response Headers', response.headers)
        this.debug('Response Data', response.data)
      }

      this.endGroup()
    }
  }

  api(method, endpoint, params, response) {
    if (this.isDebug) {
      this.startGroup(`API ${method.toUpperCase()}: ${endpoint}`)
      this.debug('Parameters', params)
      this.debug('Response', response)
      this.endGroup()
    }
  }
}

export const logger = new Logger()
