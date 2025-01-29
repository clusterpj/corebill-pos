export interface CartItem {
  id: number;
  item_id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  total: number;
  sub_total: number;
  discount_type: 'fixed' | 'percentage';
  discount: number;
  discount_val: number;
  section_id?: number;
  section_type?: string;
  section_name?: string;
  unit_name?: string;
  tax?: number;
}

export interface HoldInvoiceItem extends CartItem {
  retention_amount: number;
  retention_concept: string | null;
  retention_percentage: number | null;
  retentions_id: number | null;
}

export interface TableData {
  id: number;
  table_id: number;
  name: string;
  quantity: number;
  in_use: number;
}

export interface HoldInvoiceData {
  is_hold_invoice: boolean;
  hold_invoice_id: number | null;
  items: HoldInvoiceItem[];
  tables_selected: TableData[];
  hold_tables: TableData[];
  [key: string]: any; // For other invoice properties
}
