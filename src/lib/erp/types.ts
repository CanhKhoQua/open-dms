// ErpAdapter — the single seam between open-dms and any external system of record.
// The app depends ONLY on this interface; the concrete source is chosen at runtime
// via the ERP_ADAPTER env var. An ERP is a plugin, never the foundation.

export interface ErpCustomer {
  code: string;
  name: string;
  customerType?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  creditLimit?: number;
}

export interface ErpProduct {
  sku: string;
  name: string;
  category?: string;
  unit?: string;
  basePrice: number;
  stockQty?: number;
}

export interface ErpInvoice {
  code: string;
  customerCode: string;
  issuedAt: string; // ISO 8601
  dueDate: string; // ISO 8601
  amount: number;
  paidAmount?: number;
}

export interface ErpAdapter {
  readonly name: string;
  fetchCustomers(): Promise<ErpCustomer[]>;
  fetchProducts(): Promise<ErpProduct[]>;
  fetchOpenInvoices(): Promise<ErpInvoice[]>;
}
