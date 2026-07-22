import type { ErpAdapter, ErpCustomer, ErpProduct, ErpInvoice } from "./types";

// Built-in demo data so the app runs with zero external systems.
const customers: ErpCustomer[] = [
  { code: "KH001", name: "Tap hoa Ba Nam", customerType: "RETAIL", phone: "0900000001", address: "12 Le Loi, Q1", latitude: 10.7769, longitude: 106.7009, creditLimit: 20000000 },
  { code: "KH002", name: "Sieu thi Mini Anh Tuan", customerType: "WHOLESALE", phone: "0900000002", address: "45 Hai Ba Trung, Q3", latitude: 10.7872, longitude: 106.6969, creditLimit: 50000000 },
];

const products: ErpProduct[] = [
  { sku: "SP-COLA-330", name: "Nuoc ngot Cola 330ml", category: "BEVERAGE", unit: "lon", basePrice: 9000, stockQty: 5000 },
  { sku: "SP-MILK-1L", name: "Sua tuoi 1L", category: "DAIRY", unit: "hop", basePrice: 32000, stockQty: 800 },
];

const invoices: ErpInvoice[] = [];

export const mockAdapter: ErpAdapter = {
  name: "mock",
  async fetchCustomers() {
    return customers;
  },
  async fetchProducts() {
    return products;
  },
  async fetchOpenInvoices() {
    return invoices;
  },
};
