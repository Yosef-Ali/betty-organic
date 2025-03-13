# Order ID Standardization Plan

## Problem Statement
Currently, order IDs are inconsistent across different parts of the application:
- Random UUIDs are used for order and item identification
- IDs are displayed differently in various components
- No user-friendly format for order reference

## Proposed Solution

### Order ID Format
- Format: `BO-YYYYMMDD-XXXX`
  - Prefix: "BO" (Betty Organic)
  - Date: YYYYMMDD format
  - Sequence: 4-digit sequential number
- Example: `BO-20250313-0001`

### Technical Implementation

1. Order ID Service
```typescript
interface OrderIDService {
  generateOrderID(): string;
  private getNextSequentialNumber(): number;
  private formatOrderID(number: number): string;
  private getCurrentCounter(): number;
  private incrementCounter(): void;
}
```

2. Database Changes
```sql
ALTER TABLE orders
ADD COLUMN display_id VARCHAR(20) UNIQUE;
```

3. Components to Update:
- OrderDashboard.tsx
- PrintPreview.tsx
- ConfirmPurchaseDialog.tsx
- OrderConfirmationReceipt.tsx

### Implementation Phases

1. Phase 1: Setup (Week 1)
- Create OrderIDService
- Implement database changes
- Add migration scripts

2. Phase 2: Core Implementation (Week 2)
- Update order creation logic
- Modify order display components
- Implement migration for existing orders

3. Phase 3: Testing & Validation (Week 3)
- Test ID generation
- Verify uniqueness constraints
- Validate display formatting

4. Phase 4: Deployment (Week 4)
- Deploy database changes
- Roll out updated components
- Monitor for any issues

### Migration Strategy

1. Existing Orders
- Generate display IDs for all existing orders
- Maintain UUID references for backward compatibility
- Update UI components to show new format

2. Data Consistency
- Validate all existing order references
- Update related records
- Verify data integrity

## Benefits
1. User-friendly order references
2. Consistent display across all components
3. Improved order tracking and management
4. Better customer service experience

## Technical Considerations
1. Ensure thread-safe ID generation
2. Handle concurrent order creation
3. Implement proper error handling
4. Maintain ID sequence integrity

## Success Metrics
1. All orders have consistent ID format
2. No duplicate order IDs
3. Successful migration of existing orders
4. Positive user feedback on readability
