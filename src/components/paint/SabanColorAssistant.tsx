import React, { useState } from "react";
import { Palette, Sparkles, SlidersHorizontal, RefreshCw } from "lucide-react";
import { ColorPaletteDrawer } from "./ColorPaletteDrawer";
import { ChatColorCard } from "./ChatColorCard";
import { COLOR_FAN_DECK, findColorByCode, type ColorShade } from "@/lib/colorFanDeck";
import { Button } from "@/components/ui/button";

export interface SabanColorAssistantProps {
  /** Initial selected color code (e.g. "0021P") */
  initialColorCode?: string;
  /** Callback when user changes the active color */
  onColorChange?: (color: ColorShade) => void;
  /** Callback when an order is submitted to counter */
  onOrderSubmitted?: (summary: string) => void;
  /** Whether to show a trigger button if drawer is closed */
  showLaunchButton?: boolean;
}

/**
 * SabanColorAssistant
 * All-in-one React component integrating both:
 * 1. The Color Palette Drawer / Modal (חלונית בחירת גוון ממניפות טמבור ונירלט)
 * 2. The Chat Color Message Card (כרטיסיית תצוגת גוון אינטראקטיבית בתוך הצ'אט)
 * With AR room wall simulation, packaging & branch pickup selection, and color harmony swapping.
 */
export const SabanColorAssistant: React.FC<SabanColorAssistantProps> = ({
  initialColorCode = "0021P",
  onColorChange,
  onOrderSubmitted,
  showLaunchButton = true,
}) => {
  const [selectedColor, setSelectedColor] = useState<ColorShade>(
    () => findColorByCode(initialColorCode) || COLOR_FAN_DECK[0]!,
  );
  const [paletteDrawerOpen, setPaletteDrawerOpen] = useState(false);

  const handleSelectColor = (newColor: ColorShade) => {
    setSelectedColor(newColor);
    if (onColorChange) {
      onColorChange(newColor);
    }
  };

  return (
    <div dir="rtl" className="w-full flex flex-col items-center">
      {showLaunchButton && (
        <div className="w-full max-w-md flex items-center justify-between p-2 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <div
              className="size-6 rounded-md border border-black/15 shadow-xs"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <span className="text-xs font-bold text-foreground">
              {selectedColor.brand} • {selectedColor.name} ({selectedColor.code})
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPaletteDrawerOpen(true)}
            className="h-7 text-xs font-bold gap-1 border-amber-500/50 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200"
          >
            <Palette className="size-3.5 text-amber-600" />
            מניפת גוונים
          </Button>
        </div>
      )}

      {/* Part 2: Interactive Chat Color Message Card */}
      <ChatColorCard
        color={selectedColor}
        onColorChange={handleSelectColor}
        onOpenPalette={() => setPaletteDrawerOpen(true)}
        onOrderSuccess={onOrderSubmitted}
      />

      {/* Part 1: Color Palette Drawer / Modal */}
      <ColorPaletteDrawer
        open={paletteDrawerOpen}
        onClose={() => setPaletteDrawerOpen(false)}
        onSelectColor={handleSelectColor}
        selectedColorCode={selectedColor.code}
      />
    </div>
  );
};
