import type { ErpAdapter } from "./types";
import { mockAdapter } from "./mock";
import { csvAdapter } from "./csv";
import { misaAdapter } from "./misa";

export * from "./types";

// Chooses the data source from ERP_ADAPTER (mock | csv | misa). Defaults to mock.
export function getErpAdapter(): ErpAdapter {
  const choice = (process.env.ERP_ADAPTER ?? "mock").toLowerCase();
  switch (choice) {
    case "csv":
      return csvAdapter;
    case "misa":
      return misaAdapter;
    case "mock":
    default:
      return mockAdapter;
  }
}
