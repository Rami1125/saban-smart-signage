import { createServerFn } from "@tanstack/react-start";
import { MASTER_PRODUCTS, findProduct, normalizeSku, type Product } from "./products";

export type LobbyFeed = {
  products: Product[];
  source: "sheets" | "fallback";
};

export const getLobbyProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<LobbyFeed> => {
    const { getLobbyProductsCached } = await import("./lobby.server");
    const { products, source } = await getLobbyProductsCached();
    return { products: products.filter((p) => p.isActive), source };
  },
);

export const getProductBySku = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => ({ sku: normalizeSku((input as { sku?: unknown })?.sku) }))
  .handler(async ({ data }): Promise<{ product: Product | null; source: string }> => {
    const { getLobbyProductsCached } = await import("./lobby.server");
    const { products, source } = await getLobbyProductsCached();
    const product = findProduct(products, data.sku) ?? findProduct(MASTER_PRODUCTS, data.sku) ?? null;
    return { product, source: product ? source : "none" };
  });
