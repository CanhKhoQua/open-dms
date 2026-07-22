import type { ErpAdapter } from "./types";

// MISA adapter — STUB in the public build.
//
// In the private/production build this connects to MISA SQL Server
// (e.g. dbo.AccountObject, dbo.SAInvoice) and maps rows into the ErpCustomer /
// ErpProduct / ErpInvoice shapes. It is intentionally left unimplemented here so
// the open-source build ships no proprietary integration.
//
// This is the "here is where your ERP plugs in" seam: implement the three
// fetch* methods against your own system and set ERP_ADAPTER=misa.
const notImplemented = (): never => {
  throw new Error(
    "MISA adapter is a stub in the public build. Use ERP_ADAPTER=mock or csv, " +
      "or implement fetch* against your ERP in src/lib/erp/misa.ts.",
  );
};

export const misaAdapter: ErpAdapter = {
  name: "misa",
  async fetchCustomers() {
    return notImplemented();
  },
  async fetchProducts() {
    return notImplemented();
  },
  async fetchOpenInvoices() {
    return notImplemented();
  },
};
