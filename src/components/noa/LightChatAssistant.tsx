// ============================================================================
// LightChatAssistant.tsx: Light Mode Conversational AI Assistant
// ח. סבן חומרי בניין (1994) בע״מ | ח.פ 512001678
// Light Mode Design System • 3-Step Onboarding • Ping-Pong Action Chips
// GPS & Geofencing (Harash 10 & Talmid 6) • Price Shielding • Direct Waze
// ============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PaintBucket,
  Hammer,
  ShieldCheck,
  Package,
  Wrench,
  ChevronDown,
  Layers,
  ArrowRight,
  Info,
  Check,
  RefreshCw,
  Compass,
  Building2,
  Calendar,
  Volume2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoaAvatar } from "@/components/noa/NoaAvatar";
import { dispatchToCounter } from "@/lib/counter-dispatch";
import {
  BRANCH_HARASH,
  BRANCH_TALMID,
  GEOFENCE_RADIUS_METERS,
  type BranchCoords,
} from "@/lib/branchCoords";
import { toast } from "sonner";

// Haversine distance formula in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Pleasant Chime Synthesizer using Web Audio API
function playSoftAssistantChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    // Warm friendly chime notes: G5 (784Hz) -> C6 (1046Hz)
    osc1.frequency.setValueAtTime(783.99, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.14);

    osc2.frequency.setValueAtTime(783.99 * 1.5, now);
    osc2.frequency.exponentialRampToValueAtTime(1046.5 * 1.5, now + 0.14);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  } catch {
    // Audio fallback
  }
}

export interface QuickChip {
  label: string;
  actionText: string;
  icon?: string;
  highlight?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  time: string;
  chips?: QuickChip[];
  branchCard?: "harash" | "talmid" | "both";
  orderConfirmation?: {
    item: string;
    branch: string;
    orderId: string;
  };
}

export interface LightChatAssistantProps {
  initialBranch?: "harash" | "talmid";
  onClose?: () => void;
}

export const LightChatAssistant: React.FC<LightChatAssistantProps> = ({
  initialBranch = "harash",
  onClose,
}) => {
  // User Geo State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activeBranchGeofence, setActiveBranchGeofence] = useState<"harash" | "talmid" | null>(
    null,
  );

  // Onboarding state
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(false);
  const [activeOnboardingStep, setActiveOnboardingStep] = useState<number>(1);

  // Conversation state
  const [selectedBranch, setSelectedBranch] = useState<"harash" | "talmid">(initialBranch);
  const [inputVal, setInputVal] = useState<string>("");
  const [isAssistantThinking, setIsAssistantThinking] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute distances
  const distanceToHarash = useMemo(() => {
    if (!userCoords) return null;
    return calculateDistanceMeters(
      userCoords.lat,
      userCoords.lng,
      BRANCH_HARASH.lat,
      BRANCH_HARASH.lng,
    );
  }, [userCoords]);

  const distanceToTalmid = useMemo(() => {
    if (!userCoords) return null;
    return calculateDistanceMeters(
      userCoords.lat,
      userCoords.lng,
      BRANCH_TALMID.lat,
      BRANCH_TALMID.lng,
    );
  }, [userCoords]);

  // Request GPS Location
  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("התקן זה אינו תומך בשירותי מיקום");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        const dHarash = calculateDistanceMeters(
          latitude,
          longitude,
          BRANCH_HARASH.lat,
          BRANCH_HARASH.lng,
        );
        const dTalmid = calculateDistanceMeters(
          latitude,
          longitude,
          BRANCH_TALMID.lat,
          BRANCH_TALMID.lng,
        );

        if (dHarash <= GEOFENCE_RADIUS_METERS) {
          setActiveBranchGeofence("harash");
          setSelectedBranch("harash");
          toast.success("זיהינו שאתה נמצא בסניף החרש 10! 📍");
        } else if (dTalmid <= GEOFENCE_RADIUS_METERS) {
          setActiveBranchGeofence("talmid");
          setSelectedBranch("talmid");
          toast.success("זיהינו שאתה נמצא בסניף התלמיד 6! 📍");
        } else {
          setActiveBranchGeofence(null);
          // Auto select closest branch
          if (dHarash < dTalmid) {
            setSelectedBranch("harash");
          } else {
            setSelectedBranch("talmid");
          }
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS Geolocation error:", err.message);
        setGeoError("לא התקבלה הרשאת מיקום. ניתן לבחור סניף ידנית.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // Request location automatically on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Initial welcome message with action chips
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      text: "שלום וברוך הבא לדלפק ח. סבן! אני נועה, העוזרת המקצועית שלך. במה אוכל לסייע לך היום?",
      time: "עכשיו",
      chips: [
        {
          label: "🎨 צבעים וגיוון",
          actionText: "אני מעוניין בייעוץ על צבעים וגיוון ממוחשב",
          highlight: true,
        },
        { label: "📦 גבס ובידוד", actionText: "אני צריך לוחות גבס ופרופילים" },
        { label: "🛡️ איטום וגגות", actionText: "אני מחפש חומרי איטום (סיקה 107)" },
        { label: "🧱 מליטה וצמנט", actionText: "מלט, טיט לריצוף או בלות חול" },
        { label: "🛠️ כלי עבודה", actionText: "רולרים, מסקנטייפ וכלי צביעה" },
        { label: "📍 שעות פתיחה וניווט", actionText: "איפה נמצאים הסניפים ומה שעות הפעילות?" },
      ],
    },
  ]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAssistantThinking]);

  // Open Waze URL helper
  const openWaze = (branch: typeof BRANCH_HARASH) => {
    const url = `https://waze.com/ul?ll=${branch.lat},${branch.lng}&navigate=yes`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Branch selected label
  const activeBranchObj = selectedBranch === "harash" ? BRANCH_HARASH : BRANCH_TALMID;

  // Process Ping-Pong Conversation
  const handleUserAction = (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      text,
      time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal("");
    setIsAssistantThinking(true);

    setTimeout(() => {
      let replyText = "";
      let chips: QuickChip[] = [];
      let branchCard: "harash" | "talmid" | "both" | undefined;
      let orderConfirmation: ChatMessage["orderConfirmation"] | undefined;

      const lower = text.toLowerCase();

      // Branch & Navigation queries
      if (
        lower.includes("סניף") ||
        lower.includes("שעות") ||
        lower.includes("ניווט") ||
        lower.includes("איפה") ||
        lower.includes("כתובת") ||
        lower.includes("החרש") ||
        lower.includes("התלמיד")
      ) {
        replyText = `לחברת ח. סבן שני סניפים פעילים בהוד השרון:

1. **${BRANCH_HARASH.name}:**
   - שעות פתיחה: ימים א'-ה' 06:30–16:00, יום ו' 06:30–13:30
   - מגרש חומרים כבדים, ברזל, מלט, בלוקים ואיטום צמנטי.
   - איש קשר: ${BRANCH_HARASH.contact} (${BRANCH_HARASH.phone})

2. **${BRANCH_TALMID.name}:**
   - שעות פתיחה: ימים א'-ה' 06:30–18:00, יום ו' 06:30–14:00
   - אולם גבס, צבע וגיוון ממוחשב, כלי עבודה ופרזול.
   - איש קשר: ${BRANCH_TALMID.contact} (${BRANCH_TALMID.phone})

*ניתן ללחוץ על כפתור הניווט לניווט Waze מיידי.*`;
        branchCard = "both";
        chips = [
          { label: "🚗 ניווט לסניף החרש 10", actionText: "נווט אותי לסניף החרש 10" },
          { label: "🚗 ניווט לסניף התלמיד 6", actionText: "נווט אותי לסניף התלמיד 6" },
          { label: "🎨 ייעוץ צבע וגיוון", actionText: "אני מעוניין בייעוץ על צבעים וגיוון ממוחשב" },
          { label: "🧱 חומרי בניין ומלט", actionText: "מלט, טיט לריצוף או בלות חול" },
        ];
      }
      // Paint & Tinting queries
      else if (
        lower.includes("צבע") ||
        lower.includes("גיוון") ||
        lower.includes("טמבור") ||
        lower.includes("נירלט") ||
        lower.includes("סופרקריל") ||
        lower.includes("0524t")
      ) {
        replyText = `בסניף התלמיד 6 פועל מרכז גיוון ממוחשב מתקדם של טמבור ונירלט.
מארזי צבע נפוצים:
• **דוגמית 1 ליטר:** כיסוי של עד 8 מ״ר (לבדיקת גוון על הקיר).
• **גלון 5 ליטר:** כיסוי כ-35–40 מ״ר בשתי שכבות (מתאים לחדר ממוצע).
• **חצי פח 10 ליטר:** כיסוי כ-80 מ״ר (הכי פופולרי לדירות).
• **פח 18 ליטר:** כיסוי כ-140–150 מ״ר (לפרויקטים וחללים גדולים).

הגוון המוביל **0524T (אפור בטון עדין)** זמין לגיוון מדויק בבסיס P/A עם בחישה מלאה במערבל.

נציג הדלפק מ${activeBranchObj.name} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.`;
        chips = [
          {
            label: "🎨 הזמן 10L סופרקריל גוון 0524T",
            actionText: "אני רוצה להזמין חצי פח 10L סופרקריל מט 0524T",
            highlight: true,
          },
          { label: "📏 חישוב כמויות לפי מ״ר", actionText: "כיצד מחשבים כמות צבע לפי שטח הקירות?" },
          {
            label: "🖌️ הוסף רולר ומסקנטייפ",
            actionText: "אני צריך גם רולר 9 אינץ׳ ומסקנטייפ לצביעה",
          },
          { label: "חזרה לתפריט ראשי", actionText: "חזרה לתפריט מחלקות ראשי" },
        ];
      }
      // Drywall queries
      else if (lower.includes("גבס") || lower.includes("לוח") || lower.includes("בידוד")) {
        replyText = `במחלקת הגבס בסניף התלמיד 6 זמינים כל סוגי הלוחות והפרופילים:
• **לוח גבס לבן סטנדרטי (אורבונד):** 1.20×2.60 מ' (3.12 מ״ר ללוח).
• **לוח גבס ירוק עמיד לחות:** מיועד לחדרי רחצה, מטבחים וחללים לחים.
• **ציוד משלים:** ברגי גבס 25 מ״מ (מק״ט 76206), ניצבים 50/70, מסלולים, שפכטל אמריקאי וסרטי שריון.

נציג הדלפק מ${activeBranchObj.name} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.`;
        chips = [
          {
            label: "📦 הזמן 10 לוחות גבס ירוק",
            actionText: "אני רוצה להזמין 10 לוחות גבס ירוק וברגים",
            highlight: true,
          },
          { label: "📐 חישוב לוחות למחיצה", actionText: "כמה לוחות צריך למחיצה של 12 מ״ר?" },
          { label: "חזרה לתפריט ראשי", actionText: "חזרה לתפריט מחלקות ראשי" },
        ];
      }
      // Waterproofing queries
      else if (lower.includes("איטום") || lower.includes("סיקה") || lower.includes("107")) {
        replyText = `לאיטום מרפסות, מקלחות ומאגרי מים אנו ממליצים על **סיקה טופ 107 (SikaTop Seal-107)**:
• ערכה דו-רכיבית 25 ק״ג (20 ק״ג אבקה + 5 ק״ג נוזל פולימרי).
• כושר כיסוי: 12.5 מ״ר לערכה בשתי שכבות (2 ק״ג למ״ר לשכבה).
• דרישות מקצועיות: חובת יישום סיקה לטקס 10702 ברולקות ורשת פיברגלס שריון בין השכבות.

נציג הדלפק מ${BRANCH_HARASH.name} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.`;
        chips = [
          {
            label: "🛡️ הזמן 2 ערכות סיקה 107",
            actionText: "אני רוצה להזמין 2 ערכות סיקה 107 ורשת פיברגלס",
            highlight: true,
          },
          {
            label: "איטום תפרים בסיקפלקס 11FC",
            actionText: "אני צריך גם תרמילי סיקפלקס 11FC אפור",
          },
          { label: "חזרה לתפריט ראשי", actionText: "חזרה לתפריט מחלקות ראשי" },
        ];
      }
      // Masonry / Cement queries
      else if (
        lower.includes("מלט") ||
        lower.includes("טיט") ||
        lower.includes("חול") ||
        lower.includes("בלה")
      ) {
        replyText = `במגרש הראשי ברחוב החרש 10 זמינים כל חומרי המליטה:
• **מלט אפור נשר 25 ק״ג:** CEM II, משטח תקני = 40 שקים.
• **טיט לריצוף 181 כרמית:** כ-5 מ״ר לשק בעובי 5 מ״מ.
• **בלות חול ים / סומסום / טיט:** העמסה ישירה במלגזה לרכב מתאים (טנדר/משאית).
*שים לב: העמסת משטחים ובלות דורשת עמידה במגבלות משקל רכב.*

נציג הדלפק מ${BRANCH_HARASH.name} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.`;
        chips = [
          {
            label: "🧱 הזמן משטח מלט נשר",
            actionText: "אני צריך משטח 40 שקי מלט נשר לאיסוף במגרש החרש",
            highlight: true,
          },
          { label: "שקי טיט לריצוף 181", actionText: "אני צריך 10 שקי טיט לריצוף 181" },
          { label: "חזרה לתפריט ראשי", actionText: "חזרה לתפריט מחלקות ראשי" },
        ];
      }
      // Order Confirmation dispatch
      else if (lower.includes("להזמין") || lower.includes("הזמן") || lower.includes("אני רוצה")) {
        const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

        dispatchToCounter({
          sku: "ORDER-LIGHT-CHAT",
          productName: text,
          quantity: 1,
          unitLabel: "הזמנה",
          estimatedCost: 0, // Shielded price
          note: `הזמנת לקוח מהצ'אט הבהיר | סניף: ${activeBranchObj.name}`,
          source: "light_chat_assistant",
        });

        replyText = `מעולה! רשמתי את ההזמנה שלך במערכת הדלפק תחת מספר **${orderId}**:
• פריט / מפרט: "${text}"
• סניף איסוף יעד: **${activeBranchObj.name}**
• סטטוס: מועבר להכנה מיידית בדלפק ⏳

נציג הדלפק מ${activeBranchObj.name} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.`;

        orderConfirmation = {
          item: text,
          branch: activeBranchObj.name,
          orderId,
        };

        chips = [
          {
            label: "🚗 ניווט לסניף האיסוף",
            actionText: `נווט אותי ל${activeBranchObj.shortName}`,
            highlight: true,
          },
          { label: "📞 התקשר ישירות לדלפק", actionText: `התקשר ל${activeBranchObj.contact}` },
          { label: "התחל שיחה חדשה", actionText: "שלום" },
        ];
      }
      // General fall-through
      else {
        replyText = `רשמתי את בקשתך. כיצד תרצה להמשיך? באפשרותך לבחור מחלקה, לבדוק כמויות מדויקות או לקבל מסלול הגעה לסניף הקרוב.

נציג הדלפק מ${activeBranchObj.name} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.`;
        chips = [
          { label: "🎨 צבעים וגיוון", actionText: "אני מעוניין בייעוץ על צבעים וגיוון ממוחשב" },
          { label: "📦 גבס ובידוד", actionText: "אני צריך לוחות גבס ופרופילים" },
          { label: "🛡️ איטום וגגות", actionText: "אני מחפש חומרי איטום (סיקה 107)" },
          { label: "📍 שעות פתיחה וניווט", actionText: "איפה נמצאים הסניפים ומה שעות הפעילות?" },
        ];
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        text: replyText,
        time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        chips,
        branchCard,
        orderConfirmation,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsAssistantThinking(false);
      playSoftAssistantChime();
    }, 650);
  };

  return (
    <div
      dir="rtl"
      className="flex flex-col h-full w-full bg-slate-50 text-slate-900 font-sans select-none antialiased"
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: LIGHT LUXURY BRANDING & GEOFENCE STATUS */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/90 px-4 py-3 shadow-xs shrink-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Assistant Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <NoaAvatar size={42} showOnlineStatus={true} />
              {activeBranchGeofence && (
                <span
                  className="absolute -bottom-1 -left-1 size-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold"
                  title="בסניף כעת"
                >
                  ✓
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-900 leading-tight">
                  נועה • דלפק סבן
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  סיוע מהיר
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>סניף פעיל:</span>
                <strong className="text-slate-800">{activeBranchObj.shortName}</strong>
              </p>
            </div>
          </div>

          {/* Branch Switcher & GPS Indicator */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedBranch("harash")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedBranch === "harash"
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                סניף החרש 10
              </button>
              <button
                type="button"
                onClick={() => setSelectedBranch("talmid")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedBranch === "talmid"
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                סניף התלמיד 6
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={requestLocation}
              disabled={isLocating}
              className="h-8 px-2.5 text-xs font-semibold gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
              title="רענן מיקום GPS"
            >
              <Compass
                className={`size-3.5 ${isLocating ? "animate-spin text-amber-600" : "text-slate-500"}`}
              />
              <span className="hidden sm:inline">GPS</span>
            </Button>

            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                aria-label="סגירה"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. GEOFENCE NOTIFICATION BANNER (SCENARIO A / SCENARIO B) */}
      {/* ========================================================================= */}
      {activeBranchGeofence ? (
        // Scenario A: Customer is physically inside the branch (<250m)
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-950 animate-in slide-in-from-top-2 duration-300">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 font-bold">
              <div className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="size-3.5" />
              </div>
              <div>
                <span className="font-extrabold text-emerald-900">
                  זיהינו שאתה נמצא כעת ב
                  {activeBranchGeofence === "harash" ? BRANCH_HARASH.name : BRANCH_TALMID.name}!
                </span>
                <span className="block text-[11px] font-normal text-emerald-800">
                  נציג הדלפק ישמח לשרת אותך במקום. פנה לדלפק המכירות לאיסוף מהיר.
                </span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() =>
                handleUserAction(
                  `אני נמצא כעת ב${activeBranchGeofence === "harash" ? BRANCH_HARASH.shortName : BRANCH_TALMID.shortName}, אשמח שאיש צוות ייגש אליי לדלפק`,
                )
              }
              className="h-7 px-3 text-[11px] font-black bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shrink-0"
            >
              קרא לנציג דלפק
            </Button>
          </div>
        </div>
      ) : userCoords ? (
        // Remote distance info bar
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-4 py-2 text-[11px] text-amber-950">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 text-amber-600 shrink-0" />
              <span>
                מרחק ממך: <strong>סניף החרש 10</strong> (
                {distanceToHarash ? `${(distanceToHarash / 1000).toFixed(1)} ק״מ` : "מחשב..."}) •{" "}
                <strong>סניף התלמיד 6</strong> (
                {distanceToTalmid ? `${(distanceToTalmid / 1000).toFixed(1)} ק״מ` : "מחשב..."})
              </span>
            </div>
            <button
              type="button"
              onClick={() => openWaze(activeBranchObj)}
              className="font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
            >
              <Navigation className="size-3" />
              <span>פתח ניווט Waze ל{activeBranchObj.shortName}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 3. 3-STEP ONBOARDING GUIDE (DISMISSIBLE / INTERACTIVE) */}
      {/* ========================================================================= */}
      {!onboardingDismissed && (
        <section className="bg-white border-b border-slate-200/90 p-4 shadow-xs">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                  3
                </span>
                <h3 className="font-extrabold text-sm text-slate-900">
                  מדריך קצר לשירות ואיסוף מהיר בסבן (Onboarding):
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOnboardingDismissed(true)}
                className="text-xs text-slate-400 hover:text-slate-700 underline font-medium"
              >
                הבנתי, סגור מדריך
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Step 1 */}
              <div
                onClick={() => {
                  setActiveOnboardingStep(1);
                  handleUserAction("הצג לי את מחלקות המוצרים המובילות");
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  activeOnboardingStep === 1
                    ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="size-8 rounded-xl bg-white border border-slate-200 text-amber-600 flex items-center justify-center font-black shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">בחירת מחלקה או מוצר</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    צבעים, גבס, איטום, מליטה וכלי עבודה.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => {
                  setActiveOnboardingStep(2);
                  handleUserAction("כיצד מחשבים כמויות מ״ר לצבע או איטום?");
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  activeOnboardingStep === 2
                    ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="size-8 rounded-xl bg-white border border-slate-200 text-amber-600 flex items-center justify-center font-black shrink-0 shadow-xs">
                  2
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">חישוב כמויות וגוונים</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    התאמת ליטרים, שקים או לוחות בלחיצת כפתור.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => {
                  setActiveOnboardingStep(3);
                  handleUserAction("איך עובד שיגור הזמנת איסוף ישירות לדלפק?");
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  activeOnboardingStep === 3
                    ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="size-8 rounded-xl bg-white border border-slate-200 text-amber-600 flex items-center justify-center font-black shrink-0 shadow-xs">
                  3
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">
                    שיגור הזמנה ישירות לדלפק
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    הכנה מראש בסניף ללא צורך בהמתנה בתור.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. CHAT MESSAGES STREAM (LIGHT MODE BUBBLES) */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-start" : "items-end"} space-y-2`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-amber-500 text-slate-950 font-bold rounded-tr-xs"
                    : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs"
                }`}
              >
                <p className="whitespace-pre-line m-0">{msg.text}</p>
                <span
                  className={`block text-[10px] mt-1.5 font-medium ${
                    isUser ? "text-slate-900/70 text-left" : "text-slate-400 text-left"
                  }`}
                >
                  {msg.time}
                </span>
              </div>

              {/* Rich Branch Card (Scenario B) */}
              {msg.branchCard && (
                <div className="w-full max-w-xl space-y-2.5 animate-in fade-in duration-200">
                  {(msg.branchCard === "harash" || msg.branchCard === "both") && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-4 text-amber-600" />
                            <h4 className="font-extrabold text-sm text-slate-900">
                              {BRANCH_HARASH.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{BRANCH_HARASH.address}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          מחסן 4 ראשי
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                        <div>
                          <span className="text-slate-400 block">שעות פתיחה:</span>
                          <span className="font-bold text-slate-800">
                            א'-ה': {BRANCH_HARASH.hoursWeekday}
                          </span>
                          <span className="font-bold text-slate-800 block">
                            ו': {BRANCH_HARASH.hoursFriday}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">מנהל דלפק:</span>
                          <span className="font-bold text-slate-800">{BRANCH_HARASH.contact}</span>
                          <span className="text-slate-600 block">{BRANCH_HARASH.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => openWaze(BRANCH_HARASH)}
                          className="flex-1 h-8 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
                        >
                          <Navigation className="size-3.5" />
                          <span>נווט ב-Waze להחרש 10</span>
                          <ExternalLink className="size-3 opacity-70" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              window.location.href = `tel:${BRANCH_HARASH.phone}`;
                            }
                          }}
                          className="h-8 px-3 rounded-xl text-xs font-bold border-slate-200 text-slate-700"
                        >
                          <Phone className="size-3.5 text-slate-600" />
                          <span>חייג</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {(msg.branchCard === "talmid" || msg.branchCard === "both") && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-4 text-emerald-600" />
                            <h4 className="font-extrabold text-sm text-slate-900">
                              {BRANCH_TALMID.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{BRANCH_TALMID.address}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          מחסן 1 אולם
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                        <div>
                          <span className="text-slate-400 block">שעות פתיחה:</span>
                          <span className="font-bold text-slate-800">
                            א'-ה': {BRANCH_TALMID.hoursWeekday}
                          </span>
                          <span className="font-bold text-slate-800 block">
                            ו': {BRANCH_TALMID.hoursFriday}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">מנהל אולם:</span>
                          <span className="font-bold text-slate-800">{BRANCH_TALMID.contact}</span>
                          <span className="text-slate-600 block">{BRANCH_TALMID.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => openWaze(BRANCH_TALMID)}
                          className="flex-1 h-8 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
                        >
                          <Navigation className="size-3.5" />
                          <span>נווט ב-Waze לתלמיד 6</span>
                          <ExternalLink className="size-3 opacity-70" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              window.location.href = `tel:${BRANCH_TALMID.phone}`;
                            }
                          }}
                          className="h-8 px-3 rounded-xl text-xs font-bold border-slate-200 text-slate-700"
                        >
                          <Phone className="size-3.5 text-slate-600" />
                          <span>חייג</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order Confirmation Badge */}
              {msg.orderConfirmation && (
                <div className="w-full max-w-md bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-1.5">
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      הזמנת איסוף שודרה בהצלחה!
                    </span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800">
                      {msg.orderConfirmation.orderId}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    ממתין להכנה בדלפק {msg.orderConfirmation.branch}. נציג ייצור איתך קשר מיידית.
                  </p>
                </div>
              )}

              {/* Quick Action Chips (Ping-Pong Interaction) */}
              {msg.chips && msg.chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 w-full max-w-2xl">
                  {msg.chips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleUserAction(chip.actionText)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-2xs text-right active:scale-95 ${
                        chip.highlight
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600/40 font-bold"
                          : "bg-white hover:bg-amber-50/60 text-slate-800 border-slate-200 hover:border-amber-400"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Assistant Thinking Indicator */}
        {isAssistantThinking && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl w-fit shadow-xs animate-pulse">
            <NoaAvatar size={20} />
            <span>נועה בודקת זמינות מלאי ונתונים טכניים...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ========================================================================= */}
      {/* 5. BOTTOM INPUT BAR (TEXT INPUT & QUICK SUBMIT) */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200/90 p-3 sm:p-4 shrink-0 shadow-lg z-20">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Department Shortcut Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              type="button"
              onClick={() => handleUserAction("אני מעוניין בייעוץ על צבעים וגיוון ממוחשב")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0"
            >
              🎨 צבעים וגיוון
            </button>
            <button
              type="button"
              onClick={() => handleUserAction("אני צריך לוחות גבס ופרופילים")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0"
            >
              📦 גבס ובידוד
            </button>
            <button
              type="button"
              onClick={() => handleUserAction("אני מחפש חומרי איטום (סיקה 107)")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0"
            >
              🛡️ איטום סיקה
            </button>
            <button
              type="button"
              onClick={() => handleUserAction("איפה נמצאים הסניפים ומה שעות הפעילות?")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0"
            >
              📍 שעות סניפים ו-Waze
            </button>
          </div>

          {/* Text Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserAction(inputVal);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="שאל כל שאלה או בחר מהאפשרויות למעלה..."
              className="flex-1 h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-inner"
            />
            <Button
              type="submit"
              disabled={!inputVal.trim() || isAssistantThinking}
              className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs gap-1.5 shadow-md shrink-0"
            >
              <Send className="size-4" />
              <span>שלח</span>
            </Button>
          </form>

          {/* Privacy & Price Policy Disclaimer */}
          <p className="text-[10px] text-slate-400 text-center">
            ח. סבן חומרי בניין (1994) בע״מ • נציג הדלפק מ{activeBranchObj.shortName} ייצור איתך קשר
            מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.
          </p>
        </div>
      </footer>
    </div>
  );
};
