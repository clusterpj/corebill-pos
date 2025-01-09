# Products and Sections Documentation

## Overview
This document describes how products and sections are implemented in the CoreBill POS system. Products can belong to different sections (BAR or KITCHEN) which determine how they are handled in the order flow.

## API Endpoints

### Sections
- `GET /v1/core-pos/sections?limit=all` - Get all sections
  ```typescript
  // Response format
  {
    "success": true,
    "message": "sections",
    "sections": [
      {
        "id": 1,
        "name": "KITCHEN",
        "company_id": 1
      },
      {
        "id": 2,
        "name": "BAR",
        "company_id": 1
      }
    ]
  }
  ```

- `GET /v1/core-pos/sections/getsections/{itemId}` - Get sections for a specific item
  ```typescript
  // Response format
  {
    "success": true,
    "message": "sections",
    "sections": [
      {
        "id": 2,
        "name": "BAR",
        "company_id": 1
      }
    ]
  }
  ```

- `GET /v1/core-pos/sections/getitems/{sectionId}` - Get items for a specific section

## Data Models

### Section Type
```typescript
interface Section {
  id: number;
  name: string;
  company_id: number;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

### Product with Section
```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  formatted_price: string;
  section_id: number;
  section_type: 'bar' | 'kitchen' | 'other';
  section_name: string;
  // ... other product fields
}
```

## Implementation Details

### Section API (section-api.ts)
The section API handles all section-related requests:

```typescript
export const sectionApi = {
  async getAllSections(limit: 'all' | number = 'all'): Promise<Section[]>;
  async getSectionsForItem(itemId: number): Promise<Section[]>;
  async getItemsForSection(sectionId: number): Promise<SectionItem[]>;
}
```

### Products Store (products.js)
The products store manages product data and section assignments:

1. **Loading Products**
   - Fetches all sections first
   - Loads products with their categories
   - Associates each product with its section

2. **Section Assignment**
   - When a product is loaded, its section is fetched
   - Section type is determined by section name:
     - 'BAR' → section_type: 'bar'
     - 'KITCHEN' → section_type: 'kitchen'
     - Others → section_type: 'other'

### Cart Integration
When adding products to the cart:
1. Product data includes section information
2. Section data is preserved throughout the order process
3. Cart items maintain their section association

Example cart item:
```javascript
{
  "id": 5,
  "name": "Pizza Pepperoni",
  "price": 1699,
  "formatted_price": "$16.99",
  "quantity": 1,
  "total": 1699,
  "formatted_total": "$16.99",
  "section_id": 1,
  "section_type": "kitchen",
  "section_name": "KITCHEN"
}
```

## Usage Examples

### Fetching Product Sections
```typescript
// In a component or store
const sections = await sectionApi.getSectionsForItem(productId);
if (sections && sections.length > 0) {
  const section = sections[0];
  // Section data available in section.name, section.id, etc.
}
```

### Adding Products to Cart
```typescript
// The section information is automatically included
const product = {
  id: 6,
  name: "Mojito",
  price: 475,
  section_id: 2,
  section_type: "bar",
  section_name: "BAR"
};
cartStore.addItem(product, 1);
```

## Error Handling

1. **Missing Sections**
   - If a product's section cannot be fetched, default values are used:
     ```javascript
     {
       section_id: null,
       section_type: "other",
       section_name: "Default"
     }
     ```

2. **API Errors**
   - Section API errors are logged but don't block product loading
   - Products without sections can still be added to cart

## Logging
The system includes comprehensive logging:
- Section API responses
- Product section assignments
- Cart operations with sections

Example log pattern:
```javascript
logger.debug('[SectionAPI] Fetched all sections:', response.data);
logger.debug(`[Products] Updated product ${id} with section:`, { section });
logger.info('[PosProducts] Adding product to cart:', { product });
```

## Best Practices

1. **Section Handling**
   - Always check if sections exist before accessing
   - Use default values when section data is missing
   - Preserve section information throughout the order flow

2. **Type Safety**
   - Use TypeScript interfaces for section and product data
   - Validate section types ('bar', 'kitchen', 'other')
   - Handle nullable section fields appropriately

3. **Error Management**
   - Log section-related errors for debugging
   - Provide fallback values for missing section data
   - Don't block product functionality on section errors
