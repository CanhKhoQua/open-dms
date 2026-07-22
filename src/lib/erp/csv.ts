import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ErpAdapter, ErpCustomer, ErpProduct, ErpInvoice } from "./types";

// Minimal CSV import (comma-separated, no quoted-field support — enough for a
// clean greenfield import). Files live in ./data/{customers,products,invoices}.csv
const DATA_DIR = path.join(process.cwd(), "data");

async function readCsv(file: string): Promise<Record<string, string>[]> {
  const raw = await readFile(path.join(DATA_DIR, file), "utf8");
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

const num = (v: string): number | undefined => (v ? Number(v) : undefined);

export const csvAdapter: ErpAdapter = {
  name: "csv",
  async fetchCustomers() {
    const rows = await readCsv("customers.csv");
    return rows.map<ErpCustomer>((r) => ({
      code: r.code,
      name: r.name,
      customerType: r.customerType || undefined,
      phone: r.phone || undefined,
      address: r.address || undefined,
      latitude: num(r.latitude),
      longitude: num(r.longitude),
      creditLimit: num(r.creditLimit),
    }));
  },
  async fetchProducts() {
    const rows = await readCsv("products.csv");
    return rows.map<ErpProduct>((r) => ({
      sku: r.sku,
      name: r.name,
      category: r.category || undefined,
      unit: r.unit || undefined,
      basePrice: Number(r.basePrice || 0),
      stockQty: num(r.stockQty),
    }));
  },
  async fetchOpenInvoices() {
    const rows = await readCsv("invoices.csv");
    return rows.map<ErpInvoice>((r) => ({
      code: r.code,
      customerCode: r.customerCode,
      issuedAt: r.issuedAt,
      dueDate: r.dueDate,
      amount: Number(r.amount || 0),
      paidAmount: num(r.paidAmount),
    }));
  },
};
