import React, { useState, useRef } from "react";
import { X, Camera, RefreshCw, Sparkles, Check, Sliders, Image as ImageIcon } from "lucide-react";
import { type ColorShade, isDarkColor } from "@/lib/colorFanDeck";
import { Button } from "@/components/ui/button";

interface RoomWallSimulatorModalProps {
  color: ColorShade;
  open: boolean;
  onClose: () => void;
}

const ROOM_TEMPLATES = [
  {
    id: "living-room",
    name: "סלון מודרני מואר",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    wallPolygon: "polygon(0 0, 100% 0, 100% 78%, 0 78%)",
  },
  {
    id: "bedroom",
    name: "חדר שינה וקיר גב מיטה",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
    wallPolygon: "polygon(5% 0, 95% 0, 95% 72%, 5% 72%)",
  },
  {
    id: "dining-niche",
    name: "פינת אוכל ונישת מוקד",
    image:
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80",
    wallPolygon: "polygon(0 0, 100% 0, 100% 82%, 0 82%)",
  },
];

export const RoomWallSimulatorModal: React.FC<RoomWallSimulatorModalProps> = ({
  color,
  open,
  onClose,
}) => {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [wallOpacity, setWallOpacity] = useState(0.82);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const currentTemplate = ROOM_TEMPLATES[selectedTemplateIndex]!;
  const displayImage = uploadedImage || currentTemplate.image;
  const isDark = isDarkColor(color.hex);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card border border-border shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/40">
          <div className="flex items-center gap-3">
            <div
              className="size-8 rounded-full border border-black/15 shadow-inner"
              style={{ backgroundColor: color.hex }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  הדמיית קיר חיה — {color.name}
                </h3>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  ({color.code})
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                מותג: <strong className="text-foreground">{color.brand}</strong> · {color.family}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="סגירה"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Room Simulation Canvas */}
          <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-900 border border-border shadow-inner">
            <img
              src={displayImage}
              alt="חדר להדמיה"
              className="size-full object-cover transition-opacity duration-300"
            />

            {/* Simulated Color Wash with realistic architectural lighting blending */}
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-300"
              style={{
                backgroundColor: color.hex,
                opacity: wallOpacity,
                mixBlendMode: "multiply",
                clipPath: uploadedImage ? "none" : currentTemplate.wallPolygon,
              }}
            />

            {/* Subtle soft-light highlight layer for natural wall texture */}
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-300"
              style={{
                backgroundColor: color.hex,
                opacity: wallOpacity * 0.45,
                mixBlendMode: "color-burn",
                clipPath: uploadedImage ? "none" : currentTemplate.wallPolygon,
              }}
            />

            {/* On-screen floating tag */}
            <div className="absolute top-3 right-3 bg-black/65 backdrop-blur-md text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 border border-white/10 shadow-lg">
              <span
                className="size-3.5 rounded-full border border-white/40"
                style={{ backgroundColor: color.hex }}
              />
              <span className="font-bold">{color.name}</span>
              <span className="font-mono text-amber-400">({color.code})</span>
            </div>

            {uploadedImage && (
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 text-white rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5 backdrop-blur-sm border border-white/10"
              >
                <RefreshCw className="size-3.5" />
                חזרה לתבניות
              </button>
            )}
          </div>

          {/* Controls: Template selection & Opacity slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Room selection */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                בחר חלל להדמיה:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROOM_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setUploadedImage(null);
                      setSelectedTemplateIndex(idx);
                    }}
                    className={`relative p-1.5 rounded-lg border text-right transition-all flex flex-col gap-1 ${
                      selectedTemplateIndex === idx && !uploadedImage
                        ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
                        : "border-border hover:border-slate-400 bg-card"
                    }`}
                  >
                    <img
                      src={tmpl.image}
                      alt={tmpl.name}
                      className="w-full h-12 object-cover rounded-md"
                    />
                    <span className="text-[10px] font-bold truncate text-foreground">
                      {tmpl.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom upload & intensity slider */}
            <div className="flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="size-3.5 text-amber-500" />
                    עוצמת כיסוי / שכבות צבע:
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {Math.round(wallOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="0.95"
                  step="0.05"
                  value={wallOpacity}
                  onChange={(e) => setWallOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>שכבה ראשונה עדינה</span>
                  <span>כיסוי מלא (2 שכבות)</span>
                </div>
              </div>

              {/* Upload photo trigger */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs font-bold gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-4 text-amber-600" />
                  צילום או העלאת תמונה של החדר שלך
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground leading-snug max-w-sm">
            💡 <strong>טיפ מסבן:</strong> תאורת החלל (אור יום קר מול תאורת לד חמה 3000K) משפיעה על
            הגוון. מומלץ תמיד לרכוש דוגמית 1 ליטר לבדיקה מקדימה.
          </p>
          <Button size="sm" onClick={onClose} className="font-bold text-xs h-9 px-5">
            הבנתי, סגור הדמיה
          </Button>
        </div>
      </div>
    </div>
  );
};
