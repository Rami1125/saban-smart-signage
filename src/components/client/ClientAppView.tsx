// ============================================================================
// ClientAppView: Full-Stack Mobile-First Clean Customer PWA View
// ח. סבן חומרי בניין (1994) בע״מ | ח.פ 512001678
// Pure Client Experience: 100% Dev Stripped, Price Shielded, Full-Screen AI Chat,
// Two-Way Push Notification Chime, and Digital Pick-up Slip
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  PaintBucket,
  Hammer,
  ShieldCheck,
  Package,
  Wrench,
  MessageCircle,
  Clock,
  MapPin,
  Store,
  Phone,
  Send,
  X,
  Search,
  CheckCircle2,
  Bell,
  ArrowRight,
  Sparkles,
  QrCode,
  Volume2,
  Navigation,
  ChevronLeft,
  ChevronDown,
  Layers,
  Palette,
  Camera,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoaAvatar } from "@/components/noa/NoaAvatar";
import {
  ColorPaletteDrawer,
  RoomWallSimulatorModal,
  type ColorShade,
  findColorByCode,
} from "@/components/paint";
import { dispatchToCounter, whatsappLink } from "@/lib/counter-dispatch";
import { LightChatAssistant } from "@/components/noa/LightChatAssistant";
import { toast } from "sonner";

// Department types
export type DepartmentId = "paint" | "drywall" | "waterproof" | "masonry" | "tools";

export interface DepartmentInfo {
  id: DepartmentId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  badge: string;
  recommendedBranch: "harash" | "talmid";
  initialPrompt: string;
  popularItems: ClientCatalogItem[];
}

export interface ClientCatalogItem {
  sku: string;
  name: string;
  category: string;
  unit: string;
  volumeOrSpec?: string;
  coverageNote?: string;
  department: DepartmentId;
  defaultBranch: "harash" | "talmid";
}

// 100% Price-Shielded Catalog: Zero numerical prices or currency calculations!
const CLIENT_CATALOG: ClientCatalogItem[] = [
  // Paint & Tinting
  {
    sku: "9889488",
    name: "סופרקריל מט טמבור — גיוון ממוחשב",
    category: "צבעים וגיוון",
    unit: "פח / חצי פח",
    volumeOrSpec: "1L דוגמית | 5L גלון | 10L חצי פח | 18L פח",
    coverageNote: "כ-8 מ״ר לליטר בשכבה",
    department: "paint",
    defaultBranch: "talmid",
  },
  {
    sku: "9889499",
    name: "סופרקריל משי טמבור מהודר",
    category: "צבעים וגיוון",
    unit: "פח",
    volumeOrSpec: "5L / 18L",
    coverageNote: "ברק עדין ורחיץ לקירות פנים",
    department: "paint",
    defaultBranch: "talmid",
  },
  {
    sku: "9889510",
    name: "נירוקריל EXTRA נירלט — מגוון",
    category: "צבעים וגיוון",
    unit: "פח",
    volumeOrSpec: "5L / 18L",
    coverageNote: "כושר כיסוי גבוה ועמידות לשטיפה",
    department: "paint",
    defaultBranch: "talmid",
  },
  // Drywall & Insulation
  {
    sku: "112260",
    name: "לוח גבס ירוק עמיד לחות (טמבור/אורבונד)",
    category: "גבס ובידוד",
    unit: "לוח",
    volumeOrSpec: "1.20 × 2.60 מטר (3.12 מ״ר)",
    coverageNote: "אידיאלי לחדרי רחצה, מטבחים ואזורים רטובים",
    department: "drywall",
    defaultBranch: "talmid",
  },
  {
    sku: "111260",
    name: "לוח גבס לבן סטנדרטי (אורבונד)",
    category: "גבס ובידוד",
    unit: "לוח",
    volumeOrSpec: "1.20 × 2.60 מטר (3.12 מ״ר)",
    coverageNote: "מחיצות פנים והנמכות תקרה",
    department: "drywall",
    defaultBranch: "talmid",
  },
  {
    sku: "76206",
    name: "ברגי גבס 25 מ״מ מקצועיים בקרטון",
    category: "גבס ובידוד",
    unit: "קופסה (1,000 יח׳)",
    volumeOrSpec: "חוד קידוח מושחר",
    coverageNote: "חיבור לוחות גבס לפרופילי מתכת",
    department: "drywall",
    defaultBranch: "talmid",
  },
  // Waterproofing & Roofing
  {
    sku: "10701",
    name: "סיקה טופ 107 (SikaTop Seal-107)",
    category: "איטום וגגות",
    unit: "ערכה דו-רכיבית",
    volumeOrSpec: "25 ק״ג (אבקה + נוזל פולימרי)",
    coverageNote: "כיסוי 12.5 מ״ר ב-2 שכבות (מומלץ עם סיקה לטקס ורשת)",
    department: "waterproof",
    defaultBranch: "harash",
  },
  {
    sku: "15680",
    name: "סיקפלקס 11FC תרמיל מסטיק פוליאוריטני",
    category: "איטום וגגות",
    unit: "תרמיל (300 מ״ל)",
    volumeOrSpec: "גוון אפור / לבן / שחור",
    coverageNote: "איטום תפרי התפשטות והדבקה גמישה",
    department: "waterproof",
    defaultBranch: "harash",
  },
  {
    sku: "19255",
    name: "סיקה סרם 255 סטארפלקס דבק גמיש C2TE S1",
    category: "איטום וגגות",
    unit: "שק",
    volumeOrSpec: "25 ק״ג",
    coverageNote: "גרניט פורצלן ובריכות שחייה",
    department: "waterproof",
    defaultBranch: "harash",
  },
  // Masonry & Cement
  {
    sku: "10002",
    name: "מלט אפור נשר 25 ק״ג CEM II",
    category: "מליטה וצמנט",
    unit: "שק",
    volumeOrSpec: "25 ק״ג (משטח = 40 שקים)",
    coverageNote: "תערובות בטון, טיח והרכבת בלוקים",
    department: "masonry",
    defaultBranch: "harash",
  },
  {
    sku: "15181",
    name: "טיט לריצוף 181 כרמית מיסטר פיקס",
    category: "מליטה וצמנט",
    unit: "שק",
    volumeOrSpec: "25 ק״ג",
    coverageNote: "כ-5 מ״ר לשק בעובי 5 מ״מ (מומלץ ספייסרים ורובה)",
    department: "masonry",
    defaultBranch: "harash",
  },
  {
    sku: "11501",
    name: "בלת חול ים נקי ומנופה לבנייה",
    category: "מליטה וצמנט",
    unit: "בלה",
    volumeOrSpec: "שק ענק (כ-700 ק״ג)",
    coverageNote: "דורש העמסת מלגזה או טנדר כבד",
    department: "masonry",
    defaultBranch: "harash",
  },
  // Tools & Hardware
  {
    sku: "554102",
    name: "רולר פרו 9 אינץ׳ מושלם עם ידית ארגונומית",
    category: "כלי עבודה ופרזול",
    unit: "יח׳",
    volumeOrSpec: "פרווה איכותית ללא נשירה",
    coverageNote: "כיסוי אחיד ומהיר של קירות פנים ותקרות",
    department: "tools",
    defaultBranch: "talmid",
  },
  {
    sku: "663201",
    name: "סרט הדבקה מסקנטייפ שריון עמיד לצביעה נקייה",
    category: "כלי עבודה ופרזול",
    unit: "יח׳",
    volumeOrSpec: "רוחב 48 מ״מ, גליל 50 מטר",
    coverageNote: "הסרה קלה ללא סימני דבק או קריעה",
    department: "tools",
    defaultBranch: "talmid",
  },
  {
    sku: "14075",
    name: "טיח גבס MP75 קנאוף 25 ק״ג",
    category: "גבס ובידוד",
    unit: "שק",
    volumeOrSpec: "25 ק״ג",
    coverageNote: "2.5 מ״ר לשק בעובי 10 מ״מ (חובת בטונקונטקט)",
    department: "drywall",
    defaultBranch: "talmid",
  },
];

// Department definitions
const DEPARTMENTS: DepartmentInfo[] = [
  {
    id: "paint",
    title: "צבעים וגיוון",
    subtitle: "מניפת גוונים דיגיטלית טמבור & נירלט, שייקר גיוון ממוחשב וצבעי איכות",
    icon: <PaintBucket className="size-7 sm:size-8" />,
    accentColor:
      "from-amber-500/20 via-orange-500/10 to-amber-600/5 border-amber-500/40 text-amber-400",
    badge: "גיוון במקום",
    recommendedBranch: "talmid",
    initialPrompt: "אני מעוניין בייעוץ על גיוון צבע ממוחשב והתאמת כמויות לקירות פנים.",
    popularItems: CLIENT_CATALOG.filter((i) => i.department === "paint"),
  },
  {
    id: "drywall",
    title: "גבס ובידוד",
    subtitle: "לוחות גבס לבן וירוק לחות, פרופילי מתכת, צמר סלעים וברגים מקצועיים",
    icon: <Package className="size-7 sm:size-8" />,
    accentColor:
      "from-emerald-500/20 via-teal-500/10 to-emerald-600/5 border-emerald-500/40 text-emerald-400",
    badge: "אולם גבס",
    recommendedBranch: "talmid",
    initialPrompt: "אני צריך לוחות גבס וקונסטרוקציה (ניצבים ומסלולים) לחלוקת חדר.",
    popularItems: CLIENT_CATALOG.filter((i) => i.department === "drywall"),
  },
  {
    id: "waterproof",
    title: "איטום וגגות",
    subtitle: "סיקה טופ 107 דו-רכיבי, מסטיקים פוליאוריטניים, יריעות ביטומן ודבקים גמישים",
    icon: <ShieldCheck className="size-7 sm:size-8" />,
    accentColor: "from-blue-500/20 via-sky-500/10 to-blue-600/5 border-blue-500/40 text-blue-400",
    badge: "איטום מקצועי",
    recommendedBranch: "harash",
    initialPrompt: "אני זקוק לחומרי איטום צמנטיים (סיקה 107) ורשת פיברגלס למרפסת/חדר רטוב.",
    popularItems: CLIENT_CATALOG.filter((i) => i.department === "waterproof"),
  },
  {
    id: "masonry",
    title: "מליטה וצמנט",
    subtitle: "מלט נשר 25 ק״ג, טיט לריצוף 181, בלות חול וסומסום, בלוקים וברזל בניין",
    icon: <Hammer className="size-7 sm:size-8" />,
    accentColor:
      "from-orange-500/20 via-amber-600/10 to-orange-600/5 border-orange-500/40 text-orange-400",
    badge: "מגרש ראשי",
    recommendedBranch: "harash",
    initialPrompt: "אני מתכנן להגיע למגרש הראשי לאיסוף שקי מלט, טיט לריצוף או בלות חול.",
    popularItems: CLIENT_CATALOG.filter((i) => i.department === "masonry"),
  },
  {
    id: "tools",
    title: "כלי עבודה ופרזול",
    subtitle: "רולרים מקצועיים 9 אינץ׳, סרטי הדבקה מסקנטייפ שריון, שפכטלים וכלי צביעה",
    icon: <Wrench className="size-7 sm:size-8" />,
    accentColor:
      "from-purple-500/20 via-violet-500/10 to-purple-600/5 border-purple-500/40 text-purple-400",
    badge: "ציוד נלווה",
    recommendedBranch: "talmid",
    initialPrompt: "אני מחפש רולר פרו, סרטי מסקנטייפ וציוד משלים לצביעה ועבודות גמר.",
    popularItems: CLIENT_CATALOG.filter((i) => i.department === "tools"),
  },
];

// Service notification message schema
export interface CounterNotification {
  id: string;
  type: "question" | "ready";
  representative: string;
  branchName: string;
  message: string;
  timestamp: string;
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: string }>;
  pickupInstructions: string;
}

// Two realistic service notifications from the counter
const SERVICE_NOTIFICATIONS: CounterNotification[] = [
  {
    id: "notif-shimon-question",
    type: "question",
    representative: "שמעון מדלפק סניף החרש",
    branchName: "סניף החרש 4 (מחסן 4 - מגרש ראשי)",
    message: "שמעון מדלפק סניף החרש מטפל בפנייה שלך ויש לנו שאלה לפני הכנת הגיוון...",
    timestamp: "לפני 2 דקות",
    orderNumber: "ORD-889413",
    customerName: "ראמי מסארוה",
    items: [
      {
        name: "סופרקריל מט טמבור — 10L (גוון 0524T אפור בטון עדין, בסיס P/A)",
        quantity: "1 חצי פח",
      },
      { name: "רולר פרו 9 אינץ׳ מושלם עם ידית", quantity: "1 יח׳" },
      { name: "סרט הדבקה מסקנטייפ שריון עמיד", quantity: "2 יח׳" },
    ],
    pickupInstructions: "לוודא בחישה יסודית במערבל צבע וסימון מדבקת גוון 0524T על המכסה.",
  },
  {
    id: "notif-order-ready",
    type: "ready",
    representative: "איציק זהבי (מנהל דלפק)",
    branchName: "סניף החרש 4 (מחסן 4 - מגרש ראשי)",
    message: "הזמנתך מוכנה לאיסוף! ניתן לגשת לדלפק מחסן 4 בסניף החרש.",
    timestamp: "הרגע",
    orderNumber: "ORD-889413",
    customerName: "ראמי מסארוה",
    items: [
      { name: "סופרקריל מט טמבור — 10L (גוון 0524T מבוחש ומסומן במדבקה)", quantity: "1 חצי פח" },
      { name: "רולר פרו 9 אינץ׳ מושלם עם ידית", quantity: "1 יח׳" },
      { name: "סרט הדבקה מסקנטייפ שריון עמיד", quantity: "2 יח׳" },
    ],
    pickupInstructions:
      "גש ישירות לדלפק המכירות במחסן 4, מסור את שמך או קוד ORD-889413. ההזמנה מוכנה וממתינה!",
  },
];

// Synthesizer Web Audio API for pure crystal-clear acoustic notification chime
function playCounterNotificationChime() {
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
    // Elegant warm brass notification triad: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz) -> E6 (1318Hz)
    const notes = [
      { freq: 659.25, time: 0, duration: 0.8, gain: 0.35 },
      { freq: 830.61, time: 0.1, duration: 0.9, gain: 0.38 },
      { freq: 987.77, time: 0.22, duration: 1.1, gain: 0.42 },
      { freq: 1318.51, time: 0.35, duration: 1.6, gain: 0.3 },
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);

      gainNode.gain.setValueAtTime(0, now + time);
      gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });

    // Mobile haptic vibration pattern
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // Audio context fallback
  }
}

export const ClientAppView: React.FC = () => {
  // State
  const [selectedBranch, setSelectedBranch] = useState<"harash" | "talmid">("harash");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDepartment, setActiveDepartment] = useState<DepartmentId | null>(null);

  // Full-screen Chat Modal
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; text: string; time: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Palette & Room Simulator modals
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [simulatorColor, setSimulatorColor] = useState<ColorShade | null>(null);
  const [isLightChatOpen, setIsLightChatOpen] = useState(false);

  // Active two-way notifications & Pick-up slip
  const [activeNotification, setActiveNotification] = useState<CounterNotification | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [activeSlipData, setActiveSlipData] = useState<CounterNotification>(
    SERVICE_NOTIFICATIONS[1]!,
  );
  const [hasReceivedReadyNotification, setHasReceivedReadyNotification] = useState(false);

  // Selected item modal for fast click & collect
  const [selectedProduct, setSelectedProduct] = useState<ClientCatalogItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("ראמי מסארוה");
  const [customerPhone, setCustomerPhone] = useState("050-8860896");
  const [estimatedTime, setEstimatedTime] = useState("11:15");

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const branchLabel =
    selectedBranch === "harash"
      ? "סניף החרש 4 (מגרש ראשי לחומרים כבדים)"
      : "סניף התלמיד 6 (אולם גבס וצבע)";

  const branchContactName = selectedBranch === "harash" ? "איציק זהבי" : "יואב";
  const branchContactPhone = selectedBranch === "harash" ? "050-4482285" : "050-7855865";

  // Simulate realistic two-way notification delivery from the counter
  useEffect(() => {
    // 1st Notification: Question from Shimon at counter after 6 seconds
    const timer1 = setTimeout(() => {
      setActiveNotification(SERVICE_NOTIFICATIONS[0]!);
      playCounterNotificationChime();
    }, 6000);

    // 2nd Notification: Ready for pickup after 22 seconds
    const timer2 = setTimeout(() => {
      setActiveNotification(SERVICE_NOTIFICATIONS[1]!);
      setActiveSlipData(SERVICE_NOTIFICATIONS[1]!);
      setHasReceivedReadyNotification(true);
      playCounterNotificationChime();
    }, 22000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Filter catalog items
  const filteredItems = useMemo(() => {
    let list = CLIENT_CATALOG;
    if (activeDepartment) {
      list = list.filter((i) => i.department === activeDepartment);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeDepartment, searchQuery]);

  // Open chat with initial context from department
  const handleOpenDepartmentChat = (dept: DepartmentInfo) => {
    setIsChatOpen(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: "welcome-1",
          role: "assistant",
          text: `שלום ${customerName}! כאן נועה מדלפק ח. סבן. בחרת במחלקת ${dept.title}. איך אוכל לסייע לך בחישוב כמויות, בחירת גוון או תיאום איסוף מהיר בסניף?`,
          time: "עכשיו",
        },
      ]);
    }
    setTimeout(() => {
      handleSendChatMessage(dept.initialPrompt);
    }, 400);
  };

  const handleSendChatMessage = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: "user" as const,
      text,
      time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setIsAiThinking(true);

    // Contextual Noa AI reply with mandatory price shielding rule!
    setTimeout(() => {
      let replyText = "";

      if (
        text.includes("צבע") ||
        text.includes("גוון") ||
        text.includes("טמבור") ||
        text.includes("נירלט")
      ) {
        replyText = `בשמחה! לגיוון ממוחשב מומלץ סופרקריל מט+ או סופרקריל משי. המארזים הזמינים: דוגמית 1L (עד 8 מ״ר), גלון 5L (כ-35-40 מ״ר), חצי פח 10L (כ-80 מ״ר) ופח 18L לפרויקטים (כ-140-150 מ״ר בשתי שכבות). 

הגוון המבוקש 0524T (אפור בטון עדין) זמין לגיוון מדויק בבסיס P/A עם בחישה יסודית במערבל הדלפק ומדבקת גוון על המכסה.

*נציג הדלפק מ${branchLabel} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.*`;
      } else if (text.includes("גבס") || text.includes("לוח")) {
        replyText = `לוחות גבס ירוק עמיד לחות (1.20×2.60 מ', שטח 3.12 מ״ר ללוח) מומלצים מאוד לחדרים רטובים. לחישוב מדויק: על כל 10 מ״ר נדרשים כ-3.5 לוחות, בתוספת קופסת ברגי גבס 25 מ״מ ופרופילי ניצב/מסלול תואמים.

*נציג הדלפק מ${branchLabel} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.*`;
      } else if (text.includes("איטום") || text.includes("107") || text.includes("סיקה")) {
        replyText = `לביצוע איטום מקצועי, סיקה טופ 107 (ערכה דו-רכיבית 25 ק״ג) מכסה 12.5 מ״ר בשתי שכבות. חובה ליישם רשת פיברגלס שריון בין השכבות וסיקה לטקס SBR לרולקות חיבור רצפה-קיר.

*נציג הדלפק מ${branchLabel} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.*`;
      } else {
        replyText = `הבקשה נקלטה! רשמתי את הפרטים להכנה מוקדמת בדלפק האיסוף.

*נציג הדלפק מ${branchLabel} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.*`;
      }

      const assistantMsg = {
        id: `ast-${Date.now()}`,
        role: "assistant" as const,
        text: replyText,
        time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
      setIsAiThinking(false);
    }, 1000);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiThinking]);

  // Submit quick click & collect order
  const handleQuickOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    dispatchToCounter({
      sku: selectedProduct.sku,
      productName: selectedProduct.name,
      quantity: Number(orderQuantity) || 1,
      unitLabel: selectedProduct.unit,
      estimatedCost: 0, // Zero price! Price shielded!
      note: `איסוף עצמי לקוח: ${customerName} (${customerPhone}) | מועד: ${estimatedTime} | ${branchLabel}`,
      source: "client_app_pwa",
    });

    playCounterNotificationChime();
    toast.success("ההזמנה שודרה בהצלחה לדלפק המכירות! 🚀", {
      description: `נציג הדלפק מ${branchLabel} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.`,
      duration: 5000,
    });

    setSelectedProduct(null);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0B1320] text-slate-100 flex flex-col font-sans select-none antialiased"
    >
      {/* Interactive Top Service Notification Banner (Slides in with sound) */}
      {activeNotification && (
        <div className="sticky top-0 z-50 animate-in slide-in-from-top-4 duration-300 px-3 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 shadow-2xl border-b border-amber-300/40">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveSlipData(activeNotification);
                setIsSlipOpen(true);
              }}
              className="flex-1 flex items-center gap-3 text-right hover:opacity-95 transition-opacity"
            >
              <div className="size-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                <Bell className="size-4 animate-bounce" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded">
                    הודעת שירות מהדלפק
                  </span>
                  <span className="text-[11px] font-bold opacity-80">
                    {activeNotification.timestamp}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-950 mt-0.5 line-clamp-1">
                  {activeNotification.message}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  setActiveSlipData(activeNotification);
                  setIsSlipOpen(true);
                }}
                className="h-8 px-3 text-xs font-black bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-xl"
              >
                פתח פתקית איסוף
              </Button>
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                className="size-7 rounded-lg flex items-center justify-center text-slate-950/70 hover:text-slate-950"
                aria-label="סגור התראה"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Bar (100% Dev Stripped, Luxury Dark Theme) */}
      <header className="sticky top-0 z-40 bg-[#0B1320]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Mark */}
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg border border-amber-400/40 shrink-0">
              <span>ח.ס</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                ח. סבן חומרי בניין (1994) בע״מ
              </h1>
              <p className="text-xs text-amber-400/90 font-medium">
                איסוף עצמי מהיר Click & Collect • הוד השרון
              </p>
            </div>
          </div>

          {/* Branch Selector Pill */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setSelectedBranch("harash")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedBranch === "harash"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                סניף החרש 4 (מגרש)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBranch("talmid")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedBranch === "talmid"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                סניף התלמיד 6 (גבס וצבע)
              </button>
            </div>

            {/* Light Mode Chat with GPS & Onboarding */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLightChatOpen(true)}
              className="h-9 px-3 font-bold text-xs gap-1.5 border-amber-400/40 text-amber-300 hover:bg-amber-400/10 rounded-xl shadow-xs"
            >
              <Navigation className="size-3.5 text-amber-400" />
              <span>צ׳אט בהיר (GPS)</span>
            </Button>

            {/* Quick Chat Open Button */}
            <Button
              size="sm"
              onClick={() => {
                setIsChatOpen(true);
                if (chatMessages.length === 0) {
                  setChatMessages([
                    {
                      id: "welcome-main",
                      role: "assistant",
                      text: `שלום ${customerName}! כאן נועה מדלפק ח. סבן. אני עומדת לשירותך לחישוב כמויות, תיאום גיוון צבע או סגירת הזמנת איסוף מהיר בסניפי הוד השרון.`,
                      time: "עכשיו",
                    },
                  ]);
                }
              }}
              className="h-9 px-3.5 font-black text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl shadow-md"
            >
              <MessageCircle className="size-4" />
              <span>צ׳אט עם נועה</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Quick Banner */}
      <section className="px-4 pt-4 pb-2 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#121c2e] p-5 sm:p-6 border border-white/10 shadow-xl relative overflow-hidden">
          {/* Subtle glow backdrop */}
          <div className="absolute top-0 right-0 size-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-md">
                  סניף איסוף נוכחי: {selectedBranch === "harash" ? "סניף החרש 4" : "סניף התלמיד 6"}
                </span>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  דלפק פתוח לליקוט
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                בחר מחלקה לתיאום איסוף מהיר או התייעצות עם נועה
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                חישוב כמויות מדויק, גיוון צבע ממוחשב והכנת המוצרים בדלפק לפני הגעתך למגרש.
              </p>
            </div>

            {/* Quick Digital Slip Trigger if ready */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSlipOpen(true)}
                className="h-10 text-xs font-bold gap-1.5 border-white/20 hover:border-amber-400 text-slate-200 hover:text-white rounded-xl"
              >
                <QrCode className="size-4 text-amber-400" />
                <span>פתקית איסוף דיגיטלית</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsPaletteOpen(true)}
                className="h-10 text-xs font-bold gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 rounded-xl"
              >
                <Palette className="size-4" />
                <span>מניפת גוונים</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Giant Department Buttons (כפתורי מחלקות ענקיים ומעוצבים) */}
      <section className="px-4 py-3 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <Layers className="size-4 text-amber-400" />
            <span>מחלקות החברה המובילות:</span>
          </h3>
          <span className="text-xs text-slate-400">לחץ לשיחה וליקוט ממוקד</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEPARTMENTS.map((dept) => {
            const isCurrentActive = activeDepartment === dept.id;
            return (
              <div
                key={dept.id}
                className={`relative rounded-3xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between bg-gradient-to-br ${dept.accentColor} ${
                  isCurrentActive
                    ? "ring-2 ring-amber-400 shadow-2xl scale-[1.01]"
                    : "hover:border-white/30 bg-slate-900/60 shadow-lg"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 text-amber-400 shadow-inner">
                      {dept.icon}
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 border border-white/10 font-mono">
                      {dept.badge}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-white tracking-tight">{dept.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                    {dept.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenDepartmentChat(dept)}
                    className="flex-1 h-9 rounded-xl font-black text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>התייעץ עם נועה</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveDepartment(isCurrentActive ? null : dept.id)}
                    className="h-9 px-3 rounded-xl text-xs font-bold border-white/20 text-slate-200 hover:bg-white/10"
                  >
                    {isCurrentActive ? "הצג הכל" : "מוצרים"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Catalog Search & Fast Selection (Strictly Price-Shielded!) */}
      <section className="px-4 py-3 max-w-5xl mx-auto w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Package className="size-4 text-amber-400" />
              <span>פריטים נבחרים לאיסוף עצמי בדלפק:</span>
            </h3>
            {activeDepartment && (
              <button
                type="button"
                onClick={() => setActiveDepartment(null)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                (נקה סינון מחלקה)
              </button>
            )}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש מהיר של מוצר או מק״ט..."
              className="w-full h-8 pr-8 pl-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.sku}
              className="rounded-2xl border border-white/10 bg-slate-900/80 p-3.5 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-mono text-amber-400">מק״ט {item.sku}</span>
                  <span className="text-[10px]">{item.category}</span>
                </div>
                <h5 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors leading-snug">
                  {item.name}
                </h5>
                {item.volumeOrSpec && (
                  <p className="text-[11px] text-slate-300 mt-1">{item.volumeOrSpec}</p>
                )}
                {item.coverageNote && (
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    💡 {item.coverageNote}
                  </p>
                )}

                {/* Mandatory Price Shield Notice */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-950/70 border border-white/5 text-[10px] text-slate-300 leading-snug flex items-start gap-1.5">
                  <Info className="size-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    נציג הדלפק מ{branchLabel} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק
                    ותיאום איסוף.
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedProduct(item)}
                  className="flex-1 h-8 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  הזמן לאיסוף בדלפק
                </Button>

                {item.department === "paint" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const sampleColor = findColorByCode("0524T");
                      if (sampleColor) setSimulatorColor(sampleColor);
                    }}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold border-white/20 text-slate-200"
                    title="הדמיית קיר בצבע"
                  >
                    <Camera className="size-3.5 text-amber-400" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer (Clean, 100% Dev Stripped) */}
      <footer className="mt-auto border-t border-white/10 bg-[#070D17] px-4 py-4 text-xs text-slate-400 text-center space-y-1">
        <p className="font-bold text-slate-300">ח. סבן חומרי בניין (1994) בע״מ • ח.פ 512001678</p>
        <p className="text-[11px] text-slate-500">
          סניף החרש 4 (מחסן 4 - ראשי) • סניף התלמיד 6 (מחסן 1 - אולם גבס וצבע) • הוד השרון
        </p>
      </footer>

      {/* ========================================================================= */}
      {/* FULL-SCREEN NOA AI CHAT (חדר צ'אט AI בגודל מלא) */}
      {/* ========================================================================= */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1320] text-slate-100 animate-in fade-in duration-200">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#070D17]">
            <div className="flex items-center gap-3">
              <NoaAvatar size={42} showOnlineStatus={true} />
              <div>
                <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                  <span>נועה • נציגת דלפק ושירות</span>
                  <span className="text-amber-400">★</span>
                </h3>
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  מחוברת לדלפק • {branchLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaletteOpen(true)}
                className="h-8 text-xs font-bold gap-1 border-white/20 text-amber-300 hover:bg-white/10"
              >
                <Palette className="size-3.5" />
                <span className="hidden sm:inline">מניפת גוונים</span>
              </Button>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="size-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="סגור צ'אט"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Mandatory Price Shield Notice in Chat */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-300 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="size-3.5 text-amber-400 shrink-0" />
              <span>
                נציג הדלפק מ{branchLabel} ייצור איתך קשר מיידית לאחר השליחה לצורך חיוב מדויק ותיאום
                איסוף.
              </span>
            </span>
            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
              איש קשר: {branchContactName}
            </span>
          </div>

          {/* Messages Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 max-w-3xl mx-auto w-full"
          >
            {chatMessages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isUser ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isUser
                        ? "bg-amber-500 text-slate-950 font-bold rounded-tr-xs"
                        : "bg-slate-900 text-slate-100 border border-white/10 rounded-tl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-line m-0">{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-left ${
                        isUser ? "text-slate-900/70" : "text-slate-400"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isAiThinking && (
              <div className="flex justify-end">
                <div className="bg-slate-900 text-slate-400 border border-white/10 rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                  <span>נועה בודקת במערכת הדלפק ומחשבת כמויות...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Quick Action Prompt Suggestions */}
          <div className="p-2 border-t border-white/10 bg-slate-950/80 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() =>
                  handleSendChatMessage(
                    "אני רוצה להזמין פח 10L סופרקריל מט בגוון 0524T אפור בטון עדין",
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-white/10 shrink-0 font-medium"
              >
                🎨 גיוון 10L אפור בטון (0524T)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendChatMessage("כמה שקי סיקה 107 צריך לאיטום מרפסת של 25 מ״ר?")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 shrink-0"
              >
                🛡️ חישוב סיקה 107 ל-25 מ״ר
              </button>
              <button
                type="button"
                onClick={() => handleSendChatMessage("כמה לוחות גבס ירוק צריך למחיצה באורך 4 מטר?")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 shrink-0"
              >
                📐 לוחות גבס למחיצה
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center gap-2 mt-1"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="רשום מוצרים, כמויות מ״ר או שאלת גיוון..."
                className="flex-1 h-10 px-3.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <Button
                type="submit"
                disabled={!chatInput.trim() || isAiThinking}
                className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs gap-1.5 shadow-md"
              >
                <Send className="size-3.5" />
                <span>שלח</span>
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGITAL PICK-UP SLIP MODAL (פתקית איסוף דיגיטלית מהדלפק) */}
      {/* ========================================================================= */}
      {isSlipOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-[#0A111E] rounded-3xl border-2 border-amber-500/50 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
            {/* Slip Header */}
            <div className="p-4 sm:p-5 bg-[#070D17] border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                  <QrCode className="size-6 text-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded">
                    ח. סבן חומרי בניין (1994) בע״מ
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">
                    פתקית איסוף עצמי דיגיטלית — Click & Collect
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsSlipOpen(false)}
                className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Slip Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Order Number & Barcode Strip */}
              <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-slate-950/90 p-4 text-center space-y-2">
                <span className="text-[11px] text-slate-400 block">קוד הזמנה לסריקה בדלפק:</span>
                <span className="text-2xl font-black font-mono text-amber-400 tracking-widest block">
                  {activeSlipData.orderNumber}
                </span>

                {/* Simulated Barcode */}
                <div className="flex justify-center items-end gap-1 h-12 pt-1 opacity-80">
                  {[2, 4, 1, 3, 2, 5, 2, 1, 4, 3, 2, 4, 1, 3, 5, 2, 3, 1, 4, 2].map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xs"
                      style={{ width: `${w * 2}px`, height: "100%" }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  ||| |||| || |||||| | ||||
                </span>
              </div>

              {/* Customer & Branch Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-white/10">
                <div>
                  <span className="text-slate-400 block text-[10px]">שם הלקוח:</span>
                  <strong className="text-white font-bold">{activeSlipData.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">סטטוס נוכחי:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    מוכן לאיסוף בדלפק
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-white/10">
                  <span className="text-slate-400 block text-[10px]">סניף יעד לאיסוף:</span>
                  <strong className="text-amber-300 font-bold">{activeSlipData.branchName}</strong>
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 space-y-2 text-xs">
                <span className="font-bold text-white block">פריטים לליקוט ומסירה:</span>
                <div className="space-y-1.5">
                  {activeSlipData.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-white/5"
                    >
                      <span className="font-medium text-slate-200">• {it.name}</span>
                      <span className="font-mono font-bold text-amber-400">{it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operator Note */}
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300">
                <strong>הוראות מסירה:</strong> {activeSlipData.pickupInstructions}
              </div>

              {/* Mandatory Price Shield Notice */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 text-xs text-slate-300 text-center leading-relaxed">
                ⚖️ <strong>מדיניות תשלום:</strong> נציג הדלפק מ{activeSlipData.branchName} ייצור
                איתך קשר מיידית לצורך חיוב מדויק והסדרת תעודה בעת האיסוף.
              </div>
            </div>

            {/* Slip Action Buttons */}
            <div className="p-4 bg-[#070D17] border-t border-white/10 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                className="flex-1 h-10 rounded-xl font-black text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                asChild
              >
                <a
                  href={`https://wa.me/972504482285?text=${encodeURIComponent(
                    `שלום איציק זהבי (סניף החרש), הגעתי לאיסוף עצמי של הזמנה ${activeSlipData.orderNumber} עבור ${activeSlipData.customerName}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Phone className="size-4" />
                  <span>וואטסאפ איציק זהבי (דלפק)</span>
                </a>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl font-bold text-xs gap-1.5 border-white/20 text-slate-200"
                asChild
              >
                <a href="https://waze.com/ul?q=החרש+4+הוד+השרון" target="_blank" rel="noreferrer">
                  <Navigation className="size-4 text-sky-400" />
                  <span>ניווט Waze לסניף</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ORDER MODAL (ללא מחירים כלל!) */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-white/15 shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400">
                  מק״ט {selectedProduct.sku}
                </span>
                <h4 className="font-black text-base text-white mt-0.5">{selectedProduct.name}</h4>
                <p className="text-xs text-slate-400">{selectedProduct.category}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleQuickOrderSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-white mb-1">
                  כמות מבוקשת ({selectedProduct.unit}):
                </label>
                <input
                  type="text"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  placeholder="לדוגמה: 1"
                  className="w-full h-9 rounded-xl bg-slate-950 border border-white/15 px-3 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-white mb-1">שם מלא:</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-9 rounded-xl bg-slate-950 border border-white/15 px-3 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">טלפון נייד:</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-9 rounded-xl bg-slate-950 border border-white/15 px-3 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">שעת איסוף משוערת:</label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="11:15"
                  className="w-full h-9 rounded-xl bg-slate-950 border border-white/15 px-3 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Mandatory Price Shield Notice */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed">
                📢 <strong>מדיניות הדלפק:</strong> נציג הדלפק מ{branchLabel} ייצור איתך קשר מיידית
                לאחר השליחה לצורך חיוב מדויק ותיאום איסוף.
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 h-10 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md"
                >
                  שדר הזמנה לדלפק 🚀
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedProduct(null)}
                  className="h-10 px-4 rounded-xl text-xs font-bold border-white/15 text-slate-300"
                >
                  ביטול
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Color Palette Drawer */}
      <ColorPaletteDrawer
        open={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectColor={(shade) => {
          setIsPaletteOpen(false);
          setSimulatorColor(shade);
          handleSendChatMessage(
            `בחרתי את הגוון ${shade.name} (${shade.code}) מבית ${shade.brand}.`,
          );
        }}
      />

      {/* Wall Simulator Modal */}
      {simulatorColor && (
        <RoomWallSimulatorModal
          color={simulatorColor}
          open={Boolean(simulatorColor)}
          onClose={() => setSimulatorColor(null)}
        />
      )}

      {/* Light Mode Chat Assistant Modal */}
      {isLightChatOpen && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
          <LightChatAssistant
            initialBranch={selectedBranch}
            onClose={() => setIsLightChatOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
