import React, { useState } from "react";
import {
  PaintBucket,
  Check,
  Clock,
  User,
  Phone,
  Store,
  Sparkles,
  Camera,
  CheckCircle2,
  Printer,
  Copy,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomWallSimulatorModal } from "./RoomWallSimulatorModal";
import { findColorByCode, type ColorShade } from "@/lib/colorFanDeck";
import { whatsappLink } from "@/lib/counter-dispatch";
import { playLocationChime } from "@/lib/location-chime";
import { toast } from "sonner";
import { type PaintTintOrderData, SAMPLE_ORD_889413 } from "@/types/paintOrder";

export interface PaintTintOrderCardProps {
  order?: PaintTintOrderData;
  className?: string;
  onStatusChange?: (newStatus: string) => void;
}

export const PaintTintOrderCard: React.FC<PaintTintOrderCardProps> = ({
  order = SAMPLE_ORD_889413,
  className = "",
  onStatusChange,
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(order.status);
  const [simulatorOpen, setSimulatorOpen] = useState<boolean>(false);
  const [showLidLabel, setShowLidLabel] = useState<boolean>(false);
  const [copiedLabel, setCopiedLabel] = useState<boolean>(false);
  const [expandedNotes, setExpandedNotes] = useState<boolean>(true);

  const matchedColor: ColorShade = findColorByCode(order.paintItem.colorCode) || {
    id: "custom",
    code: order.paintItem.colorCode,
    name: order.paintItem.colorName,
    brand: "טמבור",
    hex: order.paintItem.colorHex,
    rgb: { r: 214, g: 213, b: 208 },
    family: "אפורים ובטון",
    finishRecommended: ["סופרקריל מט+"],
    similarCodes: [],
    complementaryCode: "0021P",
    description: "גוון מתוך כרטיס הזמנה איסוף מהיר סבן",
  };

  const isReady = currentStatus.includes("מוכן") || currentStatus.includes("לוקט");

  const toggleStatus = () => {
    const nextStatus = isReady ? "ממתין להכנה בדלפק ⏳" : "מוכן לאיסוף בדלפק! ✅";
    setCurrentStatus(nextStatus);
    playLocationChime("dispatch");
    if (onStatusChange) {
      onStatusChange(nextStatus);
    }
    toast.success(
      isReady ? "סטטוס הזמנה הוחזר ל'ממתין להכנה בדלפק'" : "ההזמנה סומנה כ'מוכנה לאיסוף בדלפק'!",
      {
        description: `הודעה מוכנה לשידור ללקוח ${order.customerName}`,
      },
    );
  };

  const lidLabelText = `====================================
ח. סבן חומרי בניין (1994) בע״מ
מדבקת מכסה לגיוון ממוחשב — סניף החרש 4
====================================
הזמנה: ${order.orderNumber}
לקוח: ${order.customerName} (${order.customerPhone})
גוון נבחר: ${order.paintItem.colorCode} (${order.paintItem.colorName})
קוד HEX: ${order.paintItem.colorHex}
סדרה ומכונה: ${order.paintItem.series} | ${order.paintItem.machineBase}
מארז: ${order.paintItem.quantity}
בחישה במערבל: חובה (לפני מסירה)
שעת איסוף: ${order.estimatedPickupTime}
====================================`;

  const handleCopyLabel = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(lidLabelText);
      setCopiedLabel(true);
      toast.success("מדבקת המכסה הועתקה ללוח להדפסה!");
      setTimeout(() => setCopiedLabel(false), 2200);
    }
  };

  const whatsappMessageForRep = `שלום איציק זהבי (סניף החרש 4),
לגבי כרטיס הזמנה וגיוון צבע מס׳ ${order.orderNumber}:
לקוח: ${order.customerName} (${order.customerPhone})
שעת איסוף: ${order.estimatedPickupTime}
פריט: ${order.paintItem.name}
גוון: ${order.paintItem.colorCode} (${order.paintItem.colorName})
מכונה: ${order.paintItem.machineBase} | סדרה: ${order.paintItem.series}
נלווים: ${order.companions.map((c) => `${c.name} (${c.quantity})`).join(", ")}
סטטוס: ${currentStatus}`;

  const whatsappMessageForCustomer = `שלום ${order.customerName}, כאן מצוות ח. סבן (סניף החרש 4).
הזמנת גיוון הצבע שלך (מס׳ ${order.orderNumber}) ${isReady ? "מוכנה וממתינה לך בדלפק!" : "נמצאת בהכנה וממתינה לאיסוף."}
פח צבע סופרקריל מט מגוון 0524T (${order.paintItem.colorName}) בוחש במערבל וסומן במדבקה.
כתובתנו: רחוב החרש 4, הוד השרון (מגרש ראשי).
איש קשר בדלפק: איציק זהבי 050-4482285. נסיעה בטוחה!`;

  return (
    <div
      dir="rtl"
      className={`w-full max-w-xl mx-auto rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-card via-card to-amber-50/15 dark:to-amber-950/10 shadow-xl overflow-hidden text-foreground ${className}`}
    >
      {/* Official Saban Header Bar */}
      <div className="bg-[#0B1320] text-white px-5 py-4 border-b border-amber-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
            <PaintBucket className="size-6 text-amber-400" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-amber-400 tracking-wider uppercase bg-amber-400/15 px-2 py-0.5 rounded-md">
                ח. סבן חומרי בניין (1994) בע״מ
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ח.פ 512001678</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              כרטיס הזמנה וגיוון צבע — איסוף מהיר
            </h3>
          </div>
        </div>

        <div className="text-left font-mono shrink-0">
          <span className="text-xs font-black text-amber-300 block bg-slate-800/80 px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-xs">
            {order.orderNumber}
          </span>
          <span className="text-[10px] text-slate-300 block mt-1">
            {order.dateTime || "26/09/2026 10:15"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Branch & Source strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-muted/60 p-3 rounded-2xl border border-border/80">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-amber-600 shrink-0" />
            <span>
              סניף איסוף: <strong className="text-foreground">{order.branch}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:justify-end text-muted-foreground">
            <Sparkles className="size-3.5 text-amber-500 shrink-0" />
            <span>
              מקור: <strong className="text-foreground">{order.source}</strong>
            </span>
          </div>
        </div>

        {/* Customer Details Box */}
        <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <User className="size-4 text-amber-500" />
              <span className="font-bold text-foreground text-sm">{order.customerName}</span>
              {order.customerStatus && (
                <span className="bg-amber-400/20 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                  {order.customerStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
              <Phone className="size-3.5 text-emerald-600" />
              <a
                href={`tel:${order.customerPhone}`}
                className="font-bold text-foreground hover:underline"
              >
                {order.customerPhone}
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-amber-600" />
              <span>שעת איסוף משוערת:</span>
              <strong className="text-foreground font-mono font-bold text-sm text-amber-700 dark:text-amber-300">
                {order.estimatedPickupTime}
              </strong>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
              הכנה מוקדמת בדלפק
            </span>
          </div>
        </div>

        {/* Tint Specification Stage */}
        <div className="rounded-2xl border-2 border-amber-500/40 bg-card p-4 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <PaintBucket className="size-4" />
              מפרט פריטים להכנה וגיוון:
            </span>
            <span className="text-[11px] font-mono font-bold text-muted-foreground">
              מק״ט: {order.paintItem.sku}
            </span>
          </div>

          {/* Color & Paint Container */}
          <div className="flex items-start gap-3.5 bg-muted/30 p-3 rounded-xl border border-border/80">
            {/* Swatch */}
            <div className="relative shrink-0 flex flex-col items-center">
              <div
                className="size-16 rounded-2xl border-2 border-black/20 shadow-md flex items-center justify-center transition-transform hover:scale-105"
                style={{ backgroundColor: order.paintItem.colorHex }}
                title={`קוד גוון: ${order.paintItem.colorCode}`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20 rounded-2xl pointer-events-none" />
              </div>
              <span className="text-[10px] font-mono font-black text-muted-foreground mt-1">
                {order.paintItem.colorHex}
              </span>
            </div>

            {/* Tint specs */}
            <div className="flex-1 space-y-1 text-right">
              <h4 className="font-black text-sm sm:text-base text-foreground leading-snug">
                1. {order.paintItem.name}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold px-2 py-0.5 rounded-lg border border-amber-500/30">
                  גוון נבחר: <strong>{order.paintItem.colorCode}</strong> (
                  {order.paintItem.colorName})
                </span>
                <span className="bg-slate-200 dark:bg-slate-800 text-foreground font-mono font-bold px-2 py-0.5 rounded-lg text-[11px]">
                  כמות: {order.paintItem.quantity}
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1.5">
                <span className="font-bold text-foreground">הוראת גיוון במכונה:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {order.paintItem.machineBase}
                </span>
                <span>|</span>
                <span className="font-semibold text-foreground">{order.paintItem.series}</span>
              </div>
            </div>
          </div>

          {/* Companions list */}
          {order.companions && order.companions.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <span className="text-xs font-bold text-foreground block">
                מוצרים משלימים שנבחרו:
              </span>
              <div className="space-y-1">
                {order.companions.map((comp, idx) => (
                  <div
                    key={comp.sku || idx}
                    className="flex items-center justify-between text-xs bg-card p-2 rounded-xl border border-border/80"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </span>
                      <span className="font-medium text-foreground">{comp.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        (מק״ט {comp.sku})
                      </span>
                    </div>
                    <span className="font-bold font-mono text-foreground">{comp.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operator / Warehouse Notes */}
        {order.operatorNotes && order.operatorNotes.length > 0 && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20 p-3.5 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => setExpandedNotes(!expandedNotes)}
              className="w-full flex items-center justify-between font-bold text-amber-900 dark:text-amber-300"
            >
              <span className="flex items-center gap-1.5">
                <Tag className="size-3.5 text-amber-600" />
                הערות למלקט / איש הגיוון בדלפק:
              </span>
              {expandedNotes ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>

            {expandedNotes && (
              <ul className="space-y-1 pr-2 pt-1 text-[11px] text-amber-950 dark:text-amber-200">
                {order.operatorNotes.map((note, nIdx) => (
                  <li key={nIdx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between bg-muted/60 p-3 rounded-2xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">סטטוס ליקוט נוכחי:</span>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-colors ${
                isReady
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-amber-400 text-slate-950 font-bold"
              }`}
            >
              {isReady ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
              {currentStatus}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleStatus}
            className="text-xs font-bold h-8 rounded-xl border-border hover:border-amber-500"
          >
            {isReady ? "החזר לממתין" : "סמן כמוכן בדלפק"}
          </Button>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* WhatsApp to Representative (Itzik Zehavi) */}
          <Button
            type="button"
            size="sm"
            className="h-10 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
            asChild
          >
            <a
              href={whatsappLink(whatsappMessageForRep, "972504482285")}
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="size-3.5" />
              וואטסאפ איציק זהבי (050-4482285)
            </a>
          </Button>

          {/* WhatsApp to Client (Rami Msarwa) */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10 rounded-xl font-bold text-xs gap-1.5"
            asChild
          >
            <a
              href={whatsappLink(
                whatsappMessageForCustomer,
                `972${order.customerPhone.replace(/\D/g, "").slice(1)}`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              <Check className="size-3.5 text-emerald-600" />
              עדכון לקוח (ראמי מסארוה) בוואטסאפ
            </a>
          </Button>

          {/* AR Simulator */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSimulatorOpen(true)}
            className="h-9 rounded-xl font-bold text-xs gap-1.5 border-border hover:border-amber-500 text-foreground"
          >
            <Camera className="size-3.5 text-amber-500" />
            הדמיית קיר בגוון 0524T
          </Button>

          {/* Lid Label */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLidLabel(!showLidLabel)}
            className="h-9 rounded-xl font-bold text-xs gap-1.5 border-border hover:border-amber-500 text-foreground"
          >
            <Printer className="size-3.5 text-amber-600" />
            {showLidLabel ? "הסתר מדבקת מכסה" : "הצג מדבקת מכסה לגיוון"}
          </Button>
        </div>

        {/* Printable / Copyable Lid Label */}
        {showLidLabel && (
          <div className="rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20 p-4 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-amber-600" />
                מדבקת גיוון למכסה הפח (להדבקה לפני מסירה)
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopyLabel}
                className="h-7 text-xs font-bold gap-1 text-amber-900 dark:text-amber-200"
              >
                {copiedLabel ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
                {copiedLabel ? "הועתק!" : "העתק מדבקה"}
              </Button>
            </div>
            <pre className="font-mono text-[11px] bg-card p-3 rounded-xl border border-border text-foreground overflow-x-auto whitespace-pre leading-relaxed select-all">
              {lidLabelText}
            </pre>
          </div>
        )}
      </div>

      {/* Simulator Modal */}
      <RoomWallSimulatorModal
        color={matchedColor}
        open={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />
    </div>
  );
};
