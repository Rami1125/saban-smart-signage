import React, { useState } from "react";
import {
  Palette,
  Camera,
  Store,
  Sparkles,
  Check,
  Layers,
  ArrowLeft,
  Copy,
  Sliders,
  PaintBucket,
  Info,
} from "lucide-react";
import {
  type ColorShade,
  getSimilarShades,
  getComplementaryShade,
  isDarkColor,
} from "@/lib/colorFanDeck";
import { Button } from "@/components/ui/button";
import { RoomWallSimulatorModal } from "./RoomWallSimulatorModal";
import { PaintOrderModal } from "./PaintOrderModal";
import { toast } from "sonner";

export interface ChatColorCardProps {
  color: ColorShade;
  /**
   * Callback when a user clicks a similar shade or complementary accent shade,
   * switching the card's active color.
   */
  onColorChange?: (newColor: ColorShade) => void;
  /**
   * Callback to open the full Color Palette Drawer / Modal
   */
  onOpenPalette?: () => void;
  /**
   * Optional callback when an order is submitted
   */
  onOrderSuccess?: (summary: string) => void;
}

export const ChatColorCard: React.FC<ChatColorCardProps> = ({
  color,
  onColorChange,
  onOpenPalette,
  onOrderSuccess,
}) => {
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [copiedHex, setCopiedHex] = useState(false);

  const similarShades = getSimilarShades(color);
  const complementaryShade = getComplementaryShade(color);
  const isDark = isDarkColor(color.hex);

  const handleCopyHex = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(color.hex);
      setCopiedHex(true);
      toast.success(`קוד צבע ${color.hex} הועתק ללוח!`);
      setTimeout(() => setCopiedHex(false), 2000);
    }
  };

  const handleSelectColor = (selected: ColorShade) => {
    if (onColorChange) {
      onColorChange(selected);
    }
  };

  return (
    <>
      <div
        dir="rtl"
        className="w-full max-w-md my-2 rounded-2xl border-2 border-border/90 bg-card text-foreground shadow-md overflow-hidden transition-all duration-200"
      >
        {/* Swatch Header: Generous & Prominent */}
        <div
          className="relative w-full h-36 sm:h-44 p-4 flex flex-col justify-between transition-colors duration-300 shadow-inner"
          style={{ backgroundColor: color.hex }}
        >
          {/* Subtle gloss / lighting highlight effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/20 pointer-events-none" />

          {/* Top meta tags */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-lg backdrop-blur-md shadow-xs ${
                  isDark ? "bg-white/25 text-white" : "bg-black/15 text-slate-950"
                }`}
              >
                {color.brand}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md ${
                  isDark ? "bg-black/30 text-white/90" : "bg-white/50 text-slate-900"
                }`}
              >
                {color.family}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyHex}
              title="העתק קוד HEX"
              className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-lg backdrop-blur-md transition-all active:scale-95 ${
                isDark
                  ? "bg-black/40 text-white hover:bg-black/60"
                  : "bg-white/60 text-slate-900 hover:bg-white/90"
              }`}
            >
              {copiedHex ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span>הועתק!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 opacity-75" />
                  <span>{color.hex}</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Title on Swatch */}
          <div className="relative z-10">
            <div
              className={`font-mono text-xs font-black tracking-wider uppercase drop-shadow-xs ${
                isDark ? "text-amber-300" : "text-amber-800"
              }`}
            >
              קוד גוון: {color.code}
            </div>
            <h3
              className={`text-lg sm:text-xl font-black drop-shadow-xs tracking-tight ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {color.name}
            </h3>
          </div>
        </div>

        {/* Card Body: Details & Atmosphere */}
        <div className="p-3.5 sm:p-4 space-y-3.5">
          {/* Atmosphere description */}
          <div className="rounded-xl bg-muted/50 p-2.5 border border-border/60 text-xs text-foreground/90 leading-relaxed flex items-start gap-2">
            <Sparkles className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="m-0 font-medium">{color.description}</p>
          </div>

          {/* Recommended finish series */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <PaintBucket className="size-3.5 text-amber-600" />
              סדרות מומלצות:
            </span>
            <div className="flex flex-wrap gap-1 font-bold text-foreground">
              {color.finishRecommended.map((finish) => (
                <span
                  key={finish}
                  className="bg-accent px-2 py-0.5 rounded-md text-[11px] font-semibold text-accent-foreground"
                >
                  {finish}
                </span>
              ))}
            </div>
          </div>

          {/* Similar Shades (Color Harmony) */}
          {similarShades.length > 0 && (
            <div className="border-t border-border/70 pt-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground mb-2">
                <span className="flex items-center gap-1.5">
                  <Layers className="size-3.5 text-muted-foreground" />
                  גוונים דומים באותו תת-טון:
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">לחץ להחלפה</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {similarShades.map((sim) => (
                  <button
                    key={sim.id}
                    type="button"
                    onClick={() => handleSelectColor(sim)}
                    className="flex items-center gap-2 p-1.5 rounded-lg border border-border bg-card hover:border-amber-500 hover:bg-amber-50/10 transition-all text-right group active:scale-[0.98]"
                  >
                    <div
                      className="size-7 rounded-md border border-black/15 shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: sim.hex }}
                    />
                    <div className="truncate">
                      <div className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {sim.code}
                      </div>
                      <div className="text-[11px] font-bold text-foreground truncate">
                        {sim.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accent Wall Complementary Shade */}
          {complementaryShade && (
            <div className="border-t border-border/70 pt-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Sparkles className="size-3.5" />
                  גוון משלים מומלץ לקיר כוח (Accent Wall):
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectColor(complementaryShade)}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20 hover:border-amber-500 transition-all text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="size-9 rounded-lg border border-black/20 shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: complementaryShade.hex }}
                  />
                  <div>
                    <div className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                      {complementaryShade.code} · {complementaryShade.brand}
                    </div>
                    <div className="text-xs font-black text-foreground">
                      {complementaryShade.name}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  החלף לגוון זה <ArrowLeft className="size-3" />
                </span>
              </button>
            </div>
          )}

          {/* Action Buttons: 3 Main Triggers */}
          <div className="border-t border-border/70 pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Button 1: Camera AR wall simulator */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSimulatorOpen(true)}
                className="h-10 text-xs font-bold gap-1.5 border-border hover:border-amber-500 hover:text-amber-600 transition-all"
              >
                <Camera className="size-4 text-amber-500" />
                <span>📸 הדמיה על קיר החדר</span>
              </Button>

              {/* Button 2: Packaging & Branch pickup */}
              <Button
                type="button"
                size="sm"
                onClick={() => setOrderModalOpen(true)}
                className="h-10 text-xs font-black gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm"
              >
                <Store className="size-4" />
                <span>🛒 בחירת מארז ואיסוף</span>
              </Button>
            </div>

            {/* Button 3: Re-open fan deck */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenPalette}
              className="w-full h-8 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent gap-1.5"
            >
              <Palette className="size-3.5 text-amber-500" />
              <span>🎨 החלפת גוון מתוך המניפה המלאה</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Simulator Modal */}
      <RoomWallSimulatorModal
        color={color}
        open={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />

      {/* Packaging & Branch Order Modal */}
      <PaintOrderModal
        color={color}
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onOrderSuccess={onOrderSuccess}
      />
    </>
  );
};
