import React, { useState } from "react";
import {
  X,
  Check,
  Store,
  ShoppingBag,
  ShieldCheck,
  Phone,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { type ColorShade } from "@/lib/colorFanDeck";
import { Button } from "@/components/ui/button";
import { dispatchToCounter, whatsappLink } from "@/lib/counter-dispatch";
import { dispatchDualPersistence } from "@/lib/dual-storage";
import { playLocationChime } from "@/lib/location-chime";
import { toast } from "sonner";

interface PaintOrderModalProps {
  color: ColorShade;
  open: boolean;
  onClose: () => void;
  onOrderSuccess?: (details: string) => void;
}

type PackageOption = {
  id: "1L" | "5L" | "18L";
  label: string;
  volume: string;
  approxArea: string;
  basePrice: number;
  badge?: string;
};

const PACKAGES: PackageOption[] = [
  {
    id: "1L",
    label: "דוגמית גיוון לבדיקה",
    volume: "1 ליטר",
    approxArea: "עד 8 מ״ר",
    basePrice: 38,
    badge: "מומלץ לבדיקת אור",
  },
  {
    id: "5L",
    label: "גלון חדר / סלון קטן",
    volume: "5 ליטר",
    approxArea: "כ-35-40 מ״ר (2 שכבות)",
    basePrice: 139,
    badge: "הפופולרי ביותר",
  },
  {
    id: "18L",
    label: "פח פרויקטים ודירה",
    volume: "18 ליטר",
    approxArea: "כ-130-150 מ״ר (2 שכבות)",
    basePrice: 395,
  },
];

export const PaintOrderModal: React.FC<PaintOrderModalProps> = ({
  color,
  open,
  onClose,
  onOrderSuccess,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<"1L" | "5L" | "18L">("5L");
  const [quantity, setQuantity] = useState(1);
  const [selectedFinish, setSelectedFinish] = useState(
    color.finishRecommended[0] || "סופרקריל מט+",
  );
  const [selectedBranch, setSelectedBranch] = useState<"talmid" | "harash">("talmid");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const pkg = PACKAGES.find((p) => p.id === selectedPackage) || PACKAGES[1]!;
  const totalPrice = pkg.basePrice * quantity;

  const branchName =
    selectedBranch === "talmid"
      ? "סניף התלמיד 6 (מחסן 1 - אולם צבע וגבס)"
      : "סניף החרש 4 (מחסן 4 - מגרש ראשי)";

  const branchContactName = selectedBranch === "talmid" ? "יואב" : "איציק זהבי";
  const branchContactPhone = selectedBranch === "talmid" ? "050-7855865" : "050-4482285";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("אנא הזן שם ומספר טלפון לתיאום האיסוף");
      return;
    }

    setIsSubmitting(true);
    try {
      const summaryNote = `גיוון ממוחשב: ${color.brand} קוד ${color.code} (${color.name}) | מארז ${pkg.volume} | גימור ${selectedFinish} | סניף ${branchName}`;

      dispatchToCounter({
        sku: `PAINT-${color.code.replace(/\s+/g, "")}-${selectedPackage}`,
        productName: `${color.brand} ${color.name} (${color.code}) - ${pkg.volume} [${selectedFinish}]`,
        quantity,
        unitLabel: "יח׳",
        estimatedCost: totalPrice,
        note: `איסוף עצמי דלפק: ${customerName} (${customerPhone}) | ${summaryNote}`,
        source: "color_picker_click_and_collect",
      });

      await dispatchDualPersistence({
        sku: `PAINT-${color.code.replace(/\s+/g, "")}-${selectedPackage}`,
        productName: `${color.brand} ${color.name} (${color.code}) - ${pkg.volume}`,
        quantity,
        unitLabel: "יח׳",
        unitPrice: pkg.basePrice,
        estimatedCost: totalPrice,
        warehouse: branchName,
        branchName,
        note: `הזמנת גיוון צבע: ${customerName} (${customerPhone}) | ${selectedFinish}`,
        source: "מניפת צבעים דיגיטלית סבן",
        screenId: "saban_color_terminal",
      });

      playLocationChime("dispatch");
      toast.success("הזמנת הגיוון נשלחה בהצלחה למכונת הגיוון בדלפק! 🎨", {
        description: `ממתין להכנה ב${branchName} (${branchContactName})`,
      });

      if (onOrderSuccess) {
        onOrderSuccess(
          `סוכמה הזמנת גיוון: ${quantity} יח' ${pkg.volume} מגוון ${color.name} (${color.code}) עבור ${customerName}. איסוף מ${branchName}.`,
        );
      }

      onClose();
    } catch {
      toast.error("אירעה שגיאה בשידור ההזמנה. ניתן לשלוח ישירות לוואטסאפ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `שלום ${branchContactName} (ח. סבן), אני מעוניין בהזמנת איסוף עצמי של צבע מגוון:
מותג: ${color.brand}
גוון: ${color.name} (קוד: ${color.code})
מארז: ${pkg.volume} (${pkg.label})
כמות: ${quantity} יח׳
גימור: ${selectedFinish}
סניף איסוף: ${branchName}
שם הלקוח: ${customerName || "קבלן/לקוח"}
טלפון: ${customerPhone || "בצ'אט"}`,
  );

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-card border border-border shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/40">
          <div className="flex items-center gap-3">
            <div
              className="size-8 rounded-full border border-black/15 shadow-inner"
              style={{ backgroundColor: color.hex }}
            />
            <div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">
                בחירת מארז ואיסוף בסניף — {color.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                גיוון ממוחשב מדויק במכונות טמבור ונירלט בסניפי הוד השרון
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Packaging options */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-2">
              בחר גודל מארז / פח:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PACKAGES.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedPackage(p.id)}
                  className={`relative p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                    selectedPackage === p.id
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
                      : "border-border hover:border-slate-300 bg-card"
                  }`}
                >
                  {p.badge && (
                    <span className="self-start text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded mb-1">
                      {p.badge}
                    </span>
                  )}
                  <div>
                    <div className="text-sm font-black text-foreground">{p.volume}</div>
                    <div className="text-xs font-medium text-muted-foreground">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground/80 mt-1">{p.approxArea}</div>
                  </div>
                  <div className="text-xs font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">
                    ₪{p.basePrice}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Finish & Quantity row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                סדרת גימור רצויה:
              </label>
              <select
                value={selectedFinish}
                onChange={(e) => setSelectedFinish(e.target.value)}
                className="w-full text-xs font-semibold h-9 rounded-lg border border-input bg-background px-3 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {color.finishRecommended.map((finish) => (
                  <option key={finish} value={finish}>
                    {finish}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">כמות מארזים:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="size-9 rounded-lg border border-input bg-muted/60 font-bold flex items-center justify-center text-foreground hover:bg-accent"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono font-bold text-sm text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="size-9 rounded-lg border border-input bg-muted/60 font-bold flex items-center justify-center text-foreground hover:bg-accent"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Branch choice */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              סניף איסוף מבוקש (הוד השרון):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedBranch("talmid")}
                className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                  selectedBranch === "talmid"
                    ? "border-amber-500 bg-amber-500/10 font-bold ring-1 ring-amber-500"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-foreground">סניף התלמיד 6</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    מומלץ לצבע ⭐
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  מחסן 1 — אולם גבס, צבע ופרזול (מכונת גיוון צמודה)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBranch("harash")}
                className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                  selectedBranch === "harash"
                    ? "border-amber-500 bg-amber-500/10 font-bold ring-1 ring-amber-500"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-foreground">סניף החרש 4</span>
                  <span className="text-[10px] text-muted-foreground">מגרש ראשי</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  מחסן 4 — חומרים כבדים ומליטה (ליקוט מתואם מראש)
                </div>
              </button>
            </div>
          </div>

          {/* Customer details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                שם הלקוח / קבלן:
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="לדוגמה: יוסי כהן"
                className="w-full text-xs h-9 rounded-lg border border-input bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                מספר טלפון נייד:
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="050-XXXXXXX"
                className="w-full text-xs h-9 rounded-lg border border-input bg-background px-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Total summary bar */}
          <div className="rounded-xl bg-muted/60 p-3 flex items-center justify-between border border-border">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">
                סה״כ לתשלום בדלפק:
              </span>
              <span className="text-lg font-black text-foreground font-mono">₪{totalPrice}</span>
              <span className="text-[10px] text-muted-foreground mr-1.5">(כולל מע״מ 18%)</span>
            </div>
            <div className="text-left text-xs font-semibold text-muted-foreground">
              <span>{quantity} מארזים</span> · <span>{pkg.volume}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 font-black text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950"
            >
              <ShoppingBag className="size-4" />
              שידור הזמנה לדלפק לגיוון מהיר
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-bold gap-1.5"
              asChild
            >
              <a
                href={`https://wa.me/972${branchContactPhone.replace(/\D/g, "").slice(1)}?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
              >
                <Phone className="size-3.5 text-emerald-600" />
                שיחה בוואטסאפ עם {branchContactName}
              </a>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
