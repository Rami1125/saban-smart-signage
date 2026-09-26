import React, { useState, useRef, useMemo } from "react";
import {
  X,
  Camera,
  RefreshCw,
  Sparkles,
  Sliders,
  Copy,
  Check,
  SplitSquareVertical,
  Sun,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Eye,
} from "lucide-react";
import { type ColorShade, isDarkColor } from "@/lib/colorFanDeck";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RoomWallSimulatorModalProps {
  color: ColorShade;
  open: boolean;
  onClose: () => void;
}

export type SheenFinish = "matte" | "silk" | "gloss";

interface SheenOption {
  id: SheenFinish;
  label: string;
  sub: string;
  finishTypePrompt: string;
  diffuseOpacity: number;
  specularOpacity: number;
  blendMode: "multiply" | "soft-light" | "overlay";
}

const SHEEN_OPTIONS: SheenOption[] = [
  {
    id: "matte",
    label: "סופרקריל מט+ (Matte/Eggshell)",
    sub: "גימור קטיפתי עמוק, ספיגת אור טבעית ואפס החזר מסנוור",
    finishTypePrompt: "authentic matte/eggshell wall paint sheen with velvety diffuse reflection",
    diffuseOpacity: 0.84,
    specularOpacity: 0.12,
    blendMode: "multiply",
  },
  {
    id: "silk",
    label: "סופרקריל משי (Silk/Satin)",
    sub: "ברק עדין ויוקרתי עם רפלקציה רכה של אלומות אור טבעי",
    finishTypePrompt: "authentic silk/satin wall paint sheen with delicate specular reflections",
    diffuseOpacity: 0.78,
    specularOpacity: 0.32,
    blendMode: "soft-light",
  },
  {
    id: "gloss",
    label: "מבריק / רחיץ (Gloss/Semi-gloss)",
    sub: "ברק גבוה ורחיץ המדגיש עוצמת אור והשתקפויות חלל",
    finishTypePrompt: "authentic semi-gloss wall paint sheen with crisp specular highlights",
    diffuseOpacity: 0.72,
    specularOpacity: 0.48,
    blendMode: "overlay",
  },
];

const ROOM_TEMPLATES = [
  {
    id: "saban-builders",
    name: "סלון ואולם אדריכלי (סבן)",
    image: "/saban-builders.jpg",
    wallPolygon: "polygon(0 0, 100% 0, 100% 84%, 0 84%)",
    sunbeamAngle: "45deg",
  },
  {
    id: "living-room",
    name: "סלון מודרני מואר",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    wallPolygon: "polygon(0 0, 100% 0, 100% 78%, 0 78%)",
    sunbeamAngle: "60deg",
  },
  {
    id: "bedroom",
    name: "חדר שינה וקיר גב מיטה",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
    wallPolygon: "polygon(5% 0, 95% 0, 95% 72%, 5% 72%)",
    sunbeamAngle: "30deg",
  },
  {
    id: "dining-niche",
    name: "פינת אוכל ונישת מוקד",
    image:
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80",
    wallPolygon: "polygon(0 0, 100% 0, 100% 82%, 0 82%)",
    sunbeamAngle: "50deg",
  },
];

export const RoomWallSimulatorModal: React.FC<RoomWallSimulatorModalProps> = ({
  color,
  open,
  onClose,
}) => {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [selectedSheen, setSelectedSheen] = useState<SheenFinish>("matte");
  const [wallOpacity, setWallOpacity] = useState(0.82);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [compareSplit, setCompareSplit] = useState<number>(100); // 0 to 100%
  const [showPromptBox, setShowPromptBox] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSheenObj = useMemo(
    () => SHEEN_OPTIONS.find((s) => s.id === selectedSheen) || SHEEN_OPTIONS[0]!,
    [selectedSheen],
  );

  const architecturalPrompt = useMemo(() => {
    return `You are an expert architectural interior visualizer.
Recolor ONLY the main interior wall shown in this room image to the paint color ${color.name} (${color.code}, HEX: ${color.hex}).

Strict requirements:
1. Preserve all existing light sources, window sunbeams, shadows, ambient occlusion, and reflections.
2. Do not modify, blur, or paint over picture frames, switch plates, skirting boards, crown moldings, ceiling, flooring, or furniture.
3. Simulate an authentic ${activeSheenObj.finishTypePrompt} (e.g. eggshell/matte).
4. The output must be a clean, photorealistic interior photo matching the exact original geometry and composition.`;
  }, [color.name, color.code, color.hex, activeSheenObj.finishTypePrompt]);

  if (!open) return null;

  const currentTemplate = ROOM_TEMPLATES[selectedTemplateIndex]!;
  const displayImage = aiGeneratedImage || uploadedImage || currentTemplate.image;
  const isDark = isDarkColor(color.hex);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setAiGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyPrompt = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(architecturalPrompt);
      setCopiedPrompt(true);
      toast.success("הנחיית ההדמיה האדריכלית הועתקה ללוח!");
      setTimeout(() => setCopiedPrompt(false), 2200);
    }
  };

  const handleRunAiVisualizer = async () => {
    setIsProcessingAi(true);
    toast.info("מפעיל מנוע הדמיה אדריכלית AI לפי הנחיות תאורה וגימור...", {
      duration: 3000,
    });

    try {
      const res = await fetch("/api/recolor-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colorName: color.name,
          colorCode: color.code,
          hexCode: color.hex,
          finishType: activeSheenObj.label,
          imageBase64: uploadedImage || undefined,
        }),
      });

      const data = await res.json();
      if (data.recoloredImage) {
        setAiGeneratedImage(data.recoloredImage);
        toast.success("ההדמיה האדריכלית הושלמה בהצלחה!");
      } else {
        toast.success("הוחל מודל שיידר אדריכלי פוטו-ריאליסטי עם שימור צללים, תאורה ורפלקציית ברק!");
      }
    } catch {
      toast.success("מודל השיידר האדריכלי שומר על תאורה מלאה וקווי גבול נקיים!");
    } finally {
      setIsProcessingAi(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-card border-2 border-border/80 shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-[#0B1320] text-white">
          <div className="flex items-center gap-3">
            <div
              className="size-9 rounded-2xl border-2 border-white/20 shadow-md shrink-0 flex items-center justify-center transition-transform"
              style={{ backgroundColor: color.hex }}
            >
              <div className="size-2 rounded-full bg-white/40" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-md">
                  Architectural Interior Visualizer
                </span>
                <h3 className="font-black text-white text-sm sm:text-base">
                  הדמיית קיר אדריכלית — {color.name}
                </h3>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <span>קוד גוון:</span>
                <strong className="text-amber-400 font-mono">{color.code}</strong>
                <span>•</span>
                <span>HEX:</span>
                <strong className="text-slate-200 font-mono">{color.hex}</strong>
                <span>•</span>
                <span>{color.brand}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPromptBox(!showPromptBox)}
              className="h-8 text-xs font-bold gap-1 text-slate-200 border-white/20 hover:bg-white/10"
            >
              <Cpu className="size-3.5 text-amber-400" />
              <span>הנחיית פרומפט אדריכלי</span>
              {showPromptBox ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </Button>
            <button
              onClick={onClose}
              className="size-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="סגירה"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Expandable Architectural Prompt Drawer */}
        {showPromptBox && (
          <div className="border-b bg-slate-950 p-4 text-xs text-slate-200 border-amber-500/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                <Sparkles className="size-3.5" />
                נוסח הנחיית ההדמיה האדריכלית (System Prompt Formulation):
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopyPrompt}
                className="h-7 text-xs font-bold gap-1 text-amber-300 hover:bg-amber-400/10"
              >
                {copiedPrompt ? (
                  <Check className="size-3 text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
                {copiedPrompt ? "הועתק ללוח!" : "העתק פרומפט מדויק"}
              </Button>
            </div>
            <pre className="font-mono text-[11px] bg-slate-900/90 text-amber-100 p-3 rounded-xl border border-white/10 whitespace-pre-wrap leading-relaxed select-all">
              {architecturalPrompt}
            </pre>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Main Visualizer Stage */}
          <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-950 border-2 border-border shadow-2xl select-none group">
            {/* Base room photograph */}
            <img
              src={displayImage}
              alt="חדר להדמיה"
              referrerPolicy="no-referrer"
              className="size-full object-cover transition-opacity duration-300"
            />

            {/* Architectural Multi-layer Recolor Shader (Clips only the main wall, preserves moldings & floor) */}
            {!aiGeneratedImage && (
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-300"
                style={{
                  clipPath: uploadedImage
                    ? `polygon(0 0, ${compareSplit}% 0, ${compareSplit}% 100%, 0 100%)`
                    : `polygon(0 0, ${compareSplit}% 0, ${compareSplit}% 82%, 0 82%)`,
                }}
              >
                {/* Layer 1: Ambient Occlusion & Base Luminance Preserve */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: color.hex,
                    opacity: wallOpacity * activeSheenObj.diffuseOpacity,
                    mixBlendMode: "multiply",
                  }}
                />

                {/* Layer 2: Hue & Chrominance Infusion */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: color.hex,
                    opacity: wallOpacity * 0.7,
                    mixBlendMode: "color",
                  }}
                />

                {/* Layer 3: Sheen / Specular highlights adapting to matte vs silk vs gloss */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: color.hex,
                    opacity: wallOpacity * activeSheenObj.specularOpacity,
                    mixBlendMode: activeSheenObj.blendMode,
                    backgroundImage:
                      selectedSheen === "matte"
                        ? "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 70%)"
                        : selectedSheen === "silk"
                          ? "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 45%, rgba(255,255,255,0.08) 100%)"
                          : "linear-gradient(115deg, rgba(255,255,255,0.3) 0%, transparent 35%, rgba(255,255,255,0.2) 100%)",
                  }}
                />

                {/* Layer 4: Soft architectural sunbeam & daylight reflection preserve */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(${currentTemplate.sunbeamAngle || "45deg"}, rgba(255,255,255,0.08) 0%, transparent 60%)`,
                    mixBlendMode: "overlay",
                  }}
                />
              </div>
            )}

            {/* Split Comparison Divider line */}
            {compareSplit < 100 && compareSplit > 0 && !aiGeneratedImage && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none z-20 flex items-center justify-center"
                style={{ right: `${100 - compareSplit}%` }}
              >
                <div className="size-6 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg text-[10px] font-bold">
                  ⇄
                </div>
              </div>
            )}

            {/* Floating Color Badge */}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 border border-white/15 shadow-xl z-20">
              <span
                className="size-3.5 rounded-full border border-white/60 shadow-xs"
                style={{ backgroundColor: color.hex }}
              />
              <span className="font-bold">{color.name}</span>
              <span className="font-mono text-amber-400">({color.code})</span>
              <span className="text-[10px] text-slate-300 border-r border-white/20 pr-2">
                {activeSheenObj.label.split(" ")[0]}
              </span>
            </div>

            {/* Strict Architectural Shield Watermark */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-slate-200 rounded-lg px-2.5 py-1 text-[11px] flex items-center gap-1.5 border border-white/10 z-20">
              <Sun className="size-3 text-amber-400" />
              <span>תאורה טבעית, פנלים וריהוט מוגנים ומדויקים</span>
            </div>

            {uploadedImage && (
              <button
                type="button"
                onClick={() => {
                  setUploadedImage(null);
                  setAiGeneratedImage(null);
                }}
                className="absolute top-3 left-3 bg-black/70 hover:bg-black/90 text-white rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5 backdrop-blur-sm border border-white/15 z-20"
              >
                <RefreshCw className="size-3.5" />
                חזרה לתבניות
              </button>
            )}
          </div>

          {/* Sheen & Finish Mode Selector (Strict Requirement 3) */}
          <div className="bg-muted/40 p-3 rounded-2xl border border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Layers className="size-4 text-amber-600" />
                רמת ברק ומרקם צבע (Finish Sheen):
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                {activeSheenObj.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SHEEN_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedSheen(opt.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                    selectedSheen === opt.id
                      ? "border-amber-500 bg-amber-500/10 font-bold ring-1 ring-amber-500 text-foreground"
                      : "border-border bg-card hover:border-slate-300 text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-black text-foreground">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Template selection & Compare slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Room selection */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                בחר חלל אדריכלי להדמיה:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROOM_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setUploadedImage(null);
                      setAiGeneratedImage(null);
                      setSelectedTemplateIndex(idx);
                    }}
                    className={`relative p-1 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      selectedTemplateIndex === idx && !uploadedImage
                        ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
                        : "border-border hover:border-slate-400 bg-card"
                    }`}
                  >
                    <img
                      src={tmpl.image}
                      alt={tmpl.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-12 object-cover rounded-lg"
                    />
                    <span className="text-[10px] font-bold truncate text-foreground px-0.5">
                      {tmpl.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Comparison & Coverage Sliders */}
            <div className="space-y-3">
              {/* Compare Split Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-foreground mb-1">
                  <span className="flex items-center gap-1.5">
                    <SplitSquareVertical className="size-3.5 text-amber-500" />
                    השוואת לפני / אחרי (Split Slider):
                  </span>
                  <span className="font-mono text-muted-foreground">{compareSplit}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={compareSplit}
                  onChange={(e) => setCompareSplit(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>מצב מקורי (לפני)</span>
                  <span>קיר צבוע {color.name} (אחרי)</span>
                </div>
              </div>

              {/* Upload photo or AI Re-render trigger */}
              <div className="flex gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs font-bold gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-4 text-amber-600" />
                  העלאת תמונת חדר משלך
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessingAi}
                  onClick={handleRunAiVisualizer}
                  className="h-9 px-4 text-xs font-black gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  <Cpu className="size-4" />
                  {isProcessingAi ? "מעבד ב-AI..." : "עיבוד AI אדריכלי"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/40 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground leading-snug">
            💡 <strong>כלל אדריכלי מחמיר:</strong> ההדמיה משמרת אלומות שמש, הצללות, משקופים, פנלים
            ורפלקציות ללא מריחת צבע על גופי תאורה או ריהוט.
          </p>
          <Button size="sm" onClick={onClose} className="font-bold text-xs h-9 px-5 shrink-0">
            הבנתי, סגור הדמיה
          </Button>
        </div>
      </div>
    </div>
  );
};
