import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MASTER_PRODUCTS, normalizeSku } from "@/lib/products";

type ProductSearch = {
  sku?: string;
  source?: string;
  warehouse?: string;
  screen_id?: string;
};

export const Route = createFileRoute("/product/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => {
    return {
      sku: typeof search.sku === "string" ? search.sku : undefined,
      source: typeof search.source === "string" ? search.source : undefined,
      warehouse: typeof search.warehouse === "string" ? search.warehouse : undefined,
      screen_id: typeof search.screen_id === "string" ? search.screen_id : undefined,
    };
  },
  component: ProductIndex,
});

function ProductIndex() {
  const search = Route.useSearch();
  const clientSku =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("sku") : null;
  const rawSku = search.sku || clientSku;
  const targetSku = normalizeSku(rawSku) || MASTER_PRODUCTS[0]?.sku || "19255";

  return (
    <Navigate
      to="/product/$sku"
      params={{ sku: targetSku }}
      search={{
        source: search.source || "lobby_qr",
        warehouse: search.warehouse || "auto",
        screen_id: search.screen_id || undefined,
      }}
      replace
    />
  );
}
