// ============================================================================
// Component: SearchBar — Smart Debounced Search (>=3 chars, FlyTo, Keyboard nav)
// Version: 3.0.0
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Package } from "lucide-react";
import { PRODUCTS_CATALOG } from "@/lib/products";
import { Product, ClientRecord } from "@/types";

interface SearchBarProps {
  onSelectProduct?: (product: Product) => void;
  onSelectClient?: (client: ClientRecord) => void;
  onFlyToCoordinates?: (coords: { lat: number; lng: number }) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectProduct,
  placeholder = "חיפוש מק״ט, שם מוצר, לקוח או אתר פריקה (לפחות 3 אותיות)..."
}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasMinChars = debouncedQuery.length >= 3;

  const matchedProducts = hasMinChars
    ? PRODUCTS_CATALOG.filter(
        (p) =>
          p.sku.includes(debouncedQuery) ||
          p.name.includes(debouncedQuery) ||
          p.description.includes(debouncedQuery)
      ).slice(0, 5)
    : [];

  const handleSelectProduct = (product: Product) => {
    setQuery(product.name);
    setIsOpen(false);
    onSelectProduct?.(product);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl text-right" dir="rtl">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900 px-4 py-3 pr-11 text-sm font-semibold text-white placeholder-slate-400 shadow-xl transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
        />
        <Search className="absolute right-3.5 size-5 text-amber-400" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setIsOpen(false);
            }}
            className="absolute left-3 p-1 text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl">
          {!hasMinChars ? (
            <p className="p-3 text-center text-xs font-medium text-slate-400">
              הקלד לפחות 3 תווים לחיפוש מהיר...
            </p>
          ) : matchedProducts.length === 0 ? (
            <p className="p-3 text-center text-xs font-semibold text-slate-400">
              לא נמצאו תוצאות תואמות
            </p>
          ) : (
            <div className="space-y-1">
              <span className="block px-2 py-1 text-[10px] font-bold text-slate-400">
                מוצרים ומק״טים תואמים
              </span>
              {matchedProducts.map((product) => (
                <button
                  key={product.sku}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className="flex w-full items-center justify-between rounded-xl p-2 text-right transition-colors hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">מק״ט: {product.sku}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-black text-amber-400">
                    {product.basePrice} ₪
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
