import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { MASTER_PRODUCTS } from "@/lib/products";

export const Route = createFileRoute("/product/")({
  component: ProductIndex,
});

function ProductIndex() {
  const firstSku = MASTER_PRODUCTS[0]?.sku ?? "19255";
  return <Navigate to="/product/$sku" params={{ sku: firstSku }} replace />;
}
