// Re-export from the refactored invoice-form directory.
// The original 1,320-line component has been split into sub-components
// in ./invoice-form/ for maintainability. This file preserves the
// original import path so existing consumers are not affected.
export { CreateInvoiceForm } from "./invoice-form";
export type { CreateInvoiceFormProps, InvoiceItem, ColumnKey } from "./invoice-form";
