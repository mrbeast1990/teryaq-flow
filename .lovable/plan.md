# Plan: Redesign Invoice Details UX

Redesign `InvoiceDetailsView.tsx` into a professional pharmacy ERP invoice experience without touching API logic or demo data.

## UX Improvements
- **Top Navigation**: Compact bar with "رجوع", dynamic title (فاتورة بيع/شراء), and print icon.
- **Invoice Identity**: Professional header showing Invoice # prominently, with compact rows for Movement #, Date, and Time.
- **Party Section**: Compact "العميل" or "المورد" section showing only available data (name, phone, account).
- **Items List**: High-density list optimized for mobile. 
  - Item name as dominant text.
  - Secondary barcode/code.
  - Financial row: Quantity, Price, Total in a single line.
- **Invoice Total**: Clear sticky-ready footer with total and print action.
- **Visuals**: RTL support, Cairo font, high contrast for numbers, minimal vertical waste.

## Technical Tasks
1. **Redesign `InvoiceDetailsView.tsx`**:
    - Implement `InvoiceHeader` sub-component for the top bar and identity.
    - Implement `InvoicePartyInfo` for customer/supplier details.
    - Implement `InvoiceItemRow` for high-density line items.
    - Implement `InvoiceTotal` for the final summary.
    - Support `type="sales" | "purchase"` labels dynamically.
2. **Loading/Error States**:
    - Update `LoadingState` usage or add specific invoice skeletons if needed (keeping existing `States.tsx` pattern).
    - Ensure `ErrorState` remains consistent with the back action.
3. **Refine Styles**:
    - Use existing semantic tokens (teal/emerald, slate).
    - Ensure tabular numbers (`num` class) for all financial values.

## Verification
- Verify Arabic RTL layout.
- Check mobile vs desktop responsiveness (max-width for desktop).
- Confirm no demo data was introduced.
- Confirm all existing props (`movementNo`, `transactionDateTime`, etc.) are correctly displayed.
- Build & Typecheck.
