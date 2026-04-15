

# Plan: Separate Product & Bank Selection with Filtering

## Summary
Replace the current checkbox list of banks with two separate dropdowns: **Product Type** first, then **Bank/NBFC** (filtered to only show banks offering that product). Users can add multiple product+bank pairs.

## What Changes

The Bank/NBFC Selection card gets redesigned:

```text
┌─ Bank / NBFC Selection ─────────────────────┐
│ ┌─────────────────┐  ┌──────────────────┐    │
│ │ Product Type  ▾ │  │ Bank / NBFC    ▾ │ [+Add] │
│ └─────────────────┘  └──────────────────┘    │
│                                               │
│  Personal Loan → HDFC Bank              [×]  │
│  Credit Card   → ICICI Bank             [×]  │
│  Business Loan → Bajaj Finserv          [×]  │
└───────────────────────────────────────────────┘
```

- **Product dropdown**: Lists all product types from `lendingPartners`
- **Bank dropdown**: Filtered — only shows active banks that offer the selected product
- **Add button**: Adds the product+bank pair to the list
- **Selected pairs** shown as removable rows below
- Duplicate pairs prevented

## Technical Changes

### `src/pages/LeadDetailPage.tsx`
- Replace `selectedBankIds: Set<string>` state with `selectedPairs: Array<{partnerId, partnerName, productType}>` state
- Add `selectedProduct` and `selectedBank` dropdown states
- Replace checkbox list with two `<Select>` dropdowns + Add button
- Bank dropdown filters `lendingPartners` by `selectedProduct`
- Show selected pairs as a list with remove buttons
- Update `handleToggleBank` → `handleAddPair` / `handleRemovePair`

### No other files change — types already support `SelectedBank` with `productType` field.

