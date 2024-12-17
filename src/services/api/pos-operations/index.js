import { configOperations } from './config'
import { invoiceOperations } from './invoice'
import { paymentOperations } from './payment'
import { orderOperations } from './order'

// Combine all operations into a single object
const operations = {
  ...configOperations,
  ...invoiceOperations,
  ...paymentOperations,
  ...orderOperations
}

// Export both the composable-style function and the direct operations object
// to maintain backward compatibility
export const usePosOperations = () => operations
export const posOperations = operations
export default operations
