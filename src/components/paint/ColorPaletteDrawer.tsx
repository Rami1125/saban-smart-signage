import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  Palette,
  Sparkles,
  Check,
  Filter,
  PaintBucket,
  SlidersHorizontal,
} from "lucide-react";
import {
  COLOR_FAN_DECK,
  type ColorShade,
  type ColorFamily,
  type PaintBrand,
  isDarkColor,
} from "@/lib/colorFanDeck";
import { Button } from "@/components/ui/button";

interface ColorPaletteDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelectColor: (color: ColorShade) => void;
  selectedColorCode?: string;
}

const COLOR_FAMILIES: Array<{ id: string; label: string }> = [
  { id: "all", label: "כל המשפחות" },
  { id: "לבנים ושמנת", label: "לבנים ושמנת" },
  { id: "אפורים ובטון", label: "אפורים ובטון" },
  { id: "בז' ומוקה", label: "בז' ומוקה" },
  { id: "ירוקים וטבע", label: "ירוקים וטבע" },
  { id: "פסטל ורוגע", label: "פסטל ורוגע" },
  { id: "נועזים ועמוקים", label: "נועזים ועמוקים" },
];

export const ColorPaletteDrawer: React.FC<ColorPaletteDrawerProps> = ({
  open,
  onClose,
  onSelectColor,
  selectedColorCode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<"all" | PaintBrand>("all");
  const [selectedFamily, setSelectedFamily] = useState<string>("all");

  const filteredColors = useMemo(() => {
    return COLOR_FAN_DECK.filter((item) => {
      // Brand filter
      if (selectedBrand !== "all" && item.brand !== selectedBrand) {
        return false;
      }
      // Family filter
      if (selectedFamily !== "all" && item.family !== selectedFamily) {
        return false;
      }
      // Search query (code or name or description)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesBrand = item.brand.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesBrand && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedBrand, selectedFamily]);

  if (!open) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl h-full bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <header className="px-5 py-4 border-b bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Palette className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">מניפת גוונים סבן</h2>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  טמבור & נירלט
                </span>
              </div>
              <p className="text-xs text-slate-300">
                בחירת גוון אותנטי לגיוון ממוחשב באולמות התצוגה של ח. סבן
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="סגירה"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b bg-muted/40 space-y-3 shrink-0">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי קוד גוון (למשל: 0021P, IS 0234) או שם..."
              className="w-full h-10 pr-9 pl-9 rounded-xl border border-input bg-background text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Brand tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedBrand("all")}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                selectedBrand === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              הכל ({COLOR_FAN_DECK.length})
            </button>
            <button
              onClick={() => setSelectedBrand("טמבור")}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedBrand === "טמבור"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>טמבור</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({COLOR_FAN_DECK.filter((c) => c.brand === "טמבור").length})
              </span>
            </button>
            <button
              onClick={() => setSelectedBrand("נירלט")}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedBrand === "נירלט"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>נירלט</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({COLOR_FAN_DECK.filter((c) => c.brand === "נירלט").length})
              </span>
            </button>
          </div>

          {/* Family pills (scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {COLOR_FAMILIES.map((family) => (
              <button
                key={family.id}
                onClick={() => setSelectedFamily(family.id)}
                className={`shrink-0 px-2.5 py-1 rounded-lg font-semibold transition-colors text-[11px] ${
                  selectedFamily === family.id
                    ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 font-bold"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-slate-400"
                }`}
              >
                {family.label}
              </button>
            ))}
          </div>
        </div>

        {/* Colors Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
            <span>נמצאו {filteredColors.length} גוונים</span>
            <span className="text-[11px]">לחץ על גוון כדי להזריק לשיחה</span>
          </div>

          {filteredColors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <PaintBucket className="size-10 mx-auto stroke-1 opacity-40" />
              <p className="font-bold text-sm">לא נמצאו גוונים תואמים לחיפוש</p>
              <p className="text-xs">נסה לחפש קוד אחר או לאפס את הסינונים</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedBrand("all");
                  setSelectedFamily("all");
                }}
                className="mt-2 text-xs"
              >
                איפוס סינונים
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredColors.map((color) => {
                const isSelected = selectedColorCode === color.code;
                const dark = isDarkColor(color.hex);

                return (
                  <button
                    key={color.id}
                    onClick={() => {
                      onSelectColor(color);
                      onClose();
                    }}
                    className={`group relative rounded-xl border text-right transition-all flex flex-col overflow-hidden bg-card hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
                      isSelected
                        ? "border-amber-500 ring-2 ring-amber-500 shadow-md"
                        : "border-border hover:border-slate-400"
                    }`}
                  >
                    {/* Color Swatch top */}
                    <div
                      className="relative w-full h-24 sm:h-28 flex flex-col justify-between p-2.5 transition-transform group-hover:scale-[1.02]"
                      style={{ backgroundColor: color.hex }}
                    >
                      {/* Brand badge */}
                      <span
                        className={`self-start text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs ${
                          dark ? "bg-white/20 text-white" : "bg-black/10 text-slate-900"
                        }`}
                      >
                        {color.brand}
                      </span>

                      {isSelected && (
                        <span className="absolute top-2 left-2 size-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      )}

                      {/* Hex preview */}
                      <span
                        className={`self-end text-[10px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs ${
                          dark ? "text-white/90 bg-black/30" : "text-black/80 bg-white/50"
                        }`}
                      >
                        {color.hex}
                      </span>
                    </div>

                    {/* Metadata bottom */}
                    <div className="p-2.5 flex flex-col flex-1 justify-between gap-1">
                      <div>
                        <div className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                          {color.code}
                        </div>
                        <h4 className="font-bold text-xs text-foreground leading-tight line-clamp-1">
                          {color.name}
                        </h4>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate pt-0.5 border-t border-border/60">
                        {color.family}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="p-3.5 border-t bg-muted/40 text-xs text-muted-foreground flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>מכונות גיוון זמינות בסניף התלמיד 6 והחרש 4</span>
          </div>
          <span className="font-semibold text-foreground">ח. סבן (1994) בע״מ</span>
        </footer>
      </div>
    </div>
  );
};
