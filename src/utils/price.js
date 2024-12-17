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
    // Handle null, undefined, or zero values
    if (!amount) return 0

    // If already an integer and less than a large threshold (e.g., $1M in cents), assume it's in cents
    if (Number.isInteger(amount) && amount < 100000000) return Math.round(amount)

    // If it's a large integer, it's likely already in dollars
    if (Number.isInteger(amount) && amount >= 100000000) {
      return Math.round(amount * 100)
    }

    // Handle string inputs
    if (typeof amount === 'string') {
      // Remove currency symbols, commas, and trim whitespace
      const cleanAmount = amount.replace(/[$,\s]/g, '')
      amount = parseFloat(cleanAmount)
    }

    // Validate numeric conversion
    if (isNaN(amount)) {
      console.error('Invalid price input:', amount)
      throw new Error(`Cannot convert ${amount} to cents`)
    }

    // Convert to cents, rounding to handle floating point imprecision
    return Math.round(amount * 100)
  }

  /**
   * Converts a cent amount to decimal dollars
   * @param {number|string} cents - Amount in cents
   * @returns {number} Amount in decimal dollars
   */
  /**
   * Converts cents to decimal dollars
   * @param {number|string} cents - Amount in cents
   * @returns {number} Amount in decimal dollars
   * @throws {Error} If input cannot be converted to a valid number
   */
  static toDollars(cents) {
    // Handle null, undefined, or zero values
    if (!cents) return 0

    // Handle string inputs
    if (typeof cents === 'string') {
      cents = parseInt(cents.replace(/[^0-9.-]/g, ''), 10)
    }

    // Validate numeric conversion
    if (isNaN(cents)) {
      console.error('Invalid cents input:', cents)
      throw new Error(`Cannot convert ${cents} to dollars`)
    }

    // Convert to dollars with 2 decimal precision
    return Number((cents / 100).toFixed(2))
  }

  /**
   * Formats a price for display with currency symbol
   * @param {number} amount - Amount in cents
   * @param {string} [currency='USD'] - Currency code
   * @returns {string} Formatted price string
   */
  /**
   * Formats a price for display with currency symbol
   * Handles both cent and dollar inputs
   * @param {number|string} amount - Amount in cents or dollars
   * @param {string} [currency='USD'] - Currency code
   * @returns {string} Formatted price string
   */
  static format(amount, currency = 'USD') {
    // Normalize input to cents
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
    console.log('PriceUtils.formatInvoiceAmount - Input:', { amount, type: typeof amount })
    if (!amount) return this.format(0)
    
    // If amount is small (like 5.38), it's in dollars - convert to cents
    const result = this.isInDollars(amount) 
      ? this.format(this.toCents(amount))
      : this.format(amount)
    
    console.log('PriceUtils.formatInvoiceAmount - Result:', { 
      amount, 
      isInDollars: this.isInDollars(amount),
      result 
    })
    return result
  }

  /**
   * Detects if a number is likely in dollars or cents
   * @param {number} amount - Amount to check
   * @returns {boolean} True if the amount appears to be in dollars
   */
  static isInDollars(amount) {
    console.log('PriceUtils.isInDollars - Input:', { amount, type: typeof amount })
    if (!amount) return false
    // If it has decimal places, it's in dollars
    const result = amount % 1 !== 0
    console.log('PriceUtils.isInDollars - Result:', { amount, result })
    return result
  }

  /**
   * Ensures a number is in cents regardless of input format
   * @param {number} amount - Amount either in dollars or cents
   * @returns {number} Amount in cents
   */
  static ensureCents(amount) {
    console.log('PriceUtils.ensureCents - Input:', { amount, type: typeof amount })
    if (!amount) return 0
    const result = this.isInDollars(amount) ? this.toCents(amount) : Math.round(amount)
    console.log('PriceUtils.ensureCents - Result:', { amount, result })
    return result
  }

  /**
   * Normalizes a price value to ensure consistent format
   * Handles both dollar and cent inputs
   * @param {number|string} price - Price value to normalize
   * @returns {number} Normalized price in cents
   */
  static normalizePrice(price) {
    console.log('PriceUtils.normalizePrice - Input:', { price, type: typeof price })
    if (!price) return 0
    // If price is a string, clean it and convert to number
    if (typeof price === 'string') {
      price = parseFloat(price.replace(/[^0-9.-]/g, ''))
    }
    
    // If price has decimal places, it's in dollars - convert to cents
    const result = price % 1 !== 0 ? Math.round(price * 100) : Math.round(price)
    console.log('PriceUtils.normalizePrice - Result:', { 
      price, 
      hasDecimals: price % 1 !== 0,
      result 
    })
    return result
  }

  /**
   * Safely parses a price value from any input
   * @param {number|string} value - Price value to parse
   * @returns {number} Price in cents
   */
  static parse(value) {
    console.log('PriceUtils.parse - Input:', { value, type: typeof value })
    if (!value) return 0
    if (typeof value === 'string') {
      // Remove currency symbols and whitespace
      value = value.replace(/[$,\s]/g, '')
    }
    const floatValue = parseFloat(value)
    const result = this.normalizePrice(floatValue)
    console.log('PriceUtils.parse - Result:', { value, result })
    return result
  }

  /**
   * Validates if a price value is valid
   * @param {number|string} value - Price value to validate
   * @returns {boolean} True if valid price
   */
  static isValid(value) {
    console.log('PriceUtils.isValid - Input:', { value, type: typeof value })
    if (typeof value === 'string') {
      value = this.parse(value)
    }
    const result = Number.isFinite(value) && value >= 0
    console.log('PriceUtils.isValid - Result:', { value, result })
    return result
  }

  /**
   * Calculates total from an array of items with price and quantity
   * @param {Array<{price: number, quantity: number}>} items - Array of items
   * @returns {number} Total in cents
   */
  static calculateTotal(items) {
    console.log('PriceUtils.calculateTotal - Input:', { items, type: typeof items })
    if (!Array.isArray(items)) return 0
    const result = items.reduce((sum, item) => {
      const price = this.normalizePrice(item.price)
      const quantity = Number(item.quantity) || 1
      return sum + (price * quantity)
    }, 0)
    console.log('PriceUtils.calculateTotal - Result:', { items, result })
    return result
  }
}

// Development environment test cases
if (process.env.NODE_ENV === 'development') {
  const runTests = () => {
    const testCases = [
      { input: 1.49, expected: 149 },     // Regular price
      { input: 50.00, expected: 5000 },   // Even dollars
      { input: 100.00, expected: 10000 }, // Boundary case
      { input: 999.99, expected: 99999 }, // Large amount
      { input: 0.99, expected: 99 },      // Sub-dollar
      { input: '1.49', expected: 149 },   // String input
      { input: '$1.49', expected: 149 },  // Currency symbol
      { input: 149, expected: 149 },      // Already in cents
      { input: '149', expected: 149 },    // String cents
    ]

    testCases.forEach(({ input, expected }) => {
      const result = PriceUtils.normalizePrice(input)
      console.assert(
        result === expected,
        `Price normalization failed for ${input}. Expected ${expected}, got ${result}`
      )
    })

    // Test formatInvoiceAmount
    console.assert(PriceUtils.formatInvoiceAmount(5.38) === '$5.38', 'Handle dollar amount')
    console.assert(PriceUtils.formatInvoiceAmount(538) === '$5.38', 'Handle cent amount')
    
    // Test isInDollars
    console.assert(PriceUtils.isInDollars(5.38) === true, 'Detect dollar amount')
    console.assert(PriceUtils.isInDollars(538) === false, 'Detect cent amount')
    
    // Test ensureCents
    console.assert(PriceUtils.ensureCents(5.38) === 538, 'Convert dollars to cents')
    console.assert(PriceUtils.ensureCents(538) === 538, 'Keep cents as cents')
    
    // Test edge cases
    console.assert(PriceUtils.formatInvoiceAmount(0) === '$0.00', 'Handle zero')
    console.assert(PriceUtils.formatInvoiceAmount(null) === '$0.00', 'Handle null')
    console.assert(PriceUtils.formatInvoiceAmount(undefined) === '$0.00', 'Handle undefined')
  }

  try {
    runTests()
  } catch (error) {
    console.error('Price utils test failed:', error)
  }
}
