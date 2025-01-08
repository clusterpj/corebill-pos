// src/utils/price.js

/**
 * Utility class for handling price operations throughout the application
 * All internal calculations are done in cents (integers) to avoid floating point issues
 */
export class PriceUtils {
  /**
   * Converts a decimal dollar amount to cents
   * Ensures consistent integer output for price calculations
   * @param {number|string} amount - Amount in decimal dollars or cents
   * @returns {number} Amount in cents as integer
   * @throws {Error} If input cannot be converted to a valid number
   */
  static toCents(amount) {
    if (!amount) return 0

    if (Number.isInteger(amount) && amount < 100000000) {
      return Math.round(amount)
    }

    if (Number.isInteger(amount) && amount >= 100000000) {
      return Math.round(amount * 100)
    }

    if (typeof amount === 'string') {
      const cleanAmount = amount.replace(/[$,\s]/g, '')
      amount = parseFloat(cleanAmount)
    }

    if (isNaN(amount)) {
      throw new Error(`Cannot convert ${amount} to cents`)
    }

    return Math.round(amount * 100)
  }

  /**
   * Converts cents to decimal dollars
   * @param {number|string} cents - Amount in cents
   * @returns {number} Amount in decimal dollars
   * @throws {Error} If input cannot be converted to a valid number
   */
  static toDollars(cents) {
    if (!cents) return 0

    if (typeof cents === 'string') {
      cents = parseInt(cents.replace(/[^0-9.-]/g, ''), 10)
    }

    if (isNaN(cents)) {
      throw new Error(`Cannot convert ${cents} to dollars`)
    }

    return Number((cents / 100).toFixed(2))
  }

  /**
   * Formats a price for display with currency symbol
   * Handles both cent and dollar inputs
   * @param {number|string} amount - Amount in cents or dollars
   * @param {string} [currency='USD'] - Currency code
   * @returns {string} Formatted price string
   */
  static format(amount, currency = 'USD') {
    const cents = this.toCents(amount)
    const dollars = this.toDollars(cents)

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(dollars)
  }

  /**
   * Formats invoice amounts specifically - handles both cent and dollar inputs
   * @param {number} amount - Amount either in dollars or cents
   * @returns {string} Formatted price string
   */
  static formatInvoiceAmount(amount) {
    if (!amount) return this.format(0)
    
    return this.isInDollars(amount) 
      ? this.format(this.toCents(amount))
      : this.format(amount)
  }

  /**
   * Detects if a number is likely in dollars or cents
   * @param {number} amount - Amount to check
   * @returns {boolean} True if the amount appears to be in dollars
   */
  static isInDollars(amount) {
    if (!amount) return false
    
    if (typeof amount === 'string') {
      amount = parseFloat(amount)
    }

    if (amount % 1 !== 0) return true
    
    if (Number.isInteger(amount) && amount > 0 && amount < 100) {
      return true
    }
    
    return false
  }

  /**
   * Ensures a number is in cents regardless of input format
   * @param {number} amount - Amount either in dollars or cents
   * @returns {number} Amount in cents
   */
  static ensureCents(amount) {
    if (!amount) return 0

    if (typeof amount === 'string') {
      amount = parseFloat(amount.replace(/[^0-9.-]/g, ''))
    }

    return amount % 1 !== 0 ? Math.round(amount * 100) : Math.round(amount)
  }

  /**
   * Normalizes a price value to ensure consistent format
   * Handles both dollar and cent inputs
   * @param {number|string} price - Price value to normalize
   * @returns {number} Normalized price in cents
   */
  static normalizePrice(price) {
    if (!price) return 0
    
    if (typeof price === 'string') {
      price = parseFloat(price.replace(/[^0-9.-]/g, ''))
    }
    
    return price % 1 !== 0 ? Math.round(price * 100) : Math.round(price)
  }

  /**
   * Safely parses a price value from any input
   * @param {number|string} value - Price value to parse
   * @returns {number} Price in cents
   */
  static parse(value) {
    if (!value) return 0
    if (typeof value === 'string') {
      value = value.replace(/[$,\s]/g, '')
    }
    const floatValue = parseFloat(value)
    return this.normalizePrice(floatValue)
  }

  /**
   * Validates if a price value is valid
   * @param {number|string} value - Price value to validate
   * @returns {boolean} True if valid price
   */
  static isValid(value) {
    if (typeof value === 'string') {
      value = this.parse(value)
    }
    return Number.isFinite(value) && value >= 0
  }

  /**
   * Calculates total from an array of items with price and quantity
   * @param {Array<{price: number, quantity: number}>} items - Array of items
   * @returns {number} Total in cents
   */
  static calculateTotal(items) {
    if (!Array.isArray(items)) return 0
    return items.reduce((sum, item) => {
      const price = this.normalizePrice(item.price)
      const quantity = Number(item.quantity) || 1
      return sum + (price * quantity)
    }, 0)
  }
}