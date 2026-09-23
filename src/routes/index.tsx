import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeAlert,
  Calculator,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Maximize2,
  MessageCircle,
  Minimize2,
  Package,
  Pause,
  PhoneCall,
  Play,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Trash2,
  Tv,
  Users,
  Film,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

import { NoaChat } from "@/components/noa/NoaChat";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";
import { FullScreenVideoPlayer } from "@/components/signage/FullScreenVideoPlayer";
import { VideoLibraryDrawer } from "@/components/signage/VideoLibraryDrawer";
import { Button } from "@/components/ui/button";
import {
  clearDispatchQueue,
  DispatchOrder,
  readDispatchQueue,
  whatsappLink,
} from "@/lib/counter-dispatch";
import { effectivePrice, findProduct, type Product } from "@/lib/products";
import {
  getStoredVideos,
  getStoredVideoSettings,
  saveStoredVideoSettings,
  saveStoredVideos,
} from "@/lib/videoLibrary";
import type { LobbyVideoItem, VideoLibrarySettings } from "@/types/video";

type SearchParams = {
  mode?: string;
  screen?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    mode: typeof search.mode === "string" ? search.mode : undefined,
    screen: typeof search.screen === "string" ? search.screen : undefined,
  }),
  loader: async () => {
    try {
      const { getLobbyProductsCached } = await import("@/lib/lobby.server");
      const res = await getLobbyProductsCached();
      return { products: res.products, source: res.source };
    } catch {
      return { products: [], source: "sheets" };
    }
  },
  component: Index,
});

type ScreenMode = "tv" | "pos" | "widescreen";

export const SLIDE_TRANSITION_EFFECTS = [
  {
    id: "slide-push",
    label: "גלישה חלקה",
    className: "animate-slide-push",
    desc: "תנועה אופקית מטושטשת ומתבהרת",
  },
  {
    id: "zoom-depth",
    label: "זום עומק",
    className: "animate-zoom-depth",
    desc: "התמקדות עומק ופוקוס קולנועי",
  },
  {
    id: "shutter-wipe",
    label: "חשיפת וילון",
    className: "animate-shutter-wipe",
    desc: "חשיפה מדורגת רכה",
  },
  {
    id: "flip-perspective",
    label: "הטיית תלת-ממד",
    className: "animate-flip-perspective",
    desc: "הטיה מרחבית תלת-ממדית",
  },
  {
    id: "lift-rise",
    label: "עלייה רכה",
    className: "animate-lift-rise",
    desc: "נסיקה אנכית והתקבעות על המסך",
  },
] as const;

export function Index() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();

  // Active products list (fetched strictly from Google Sheets 📦 קטלוג_מוצרים)
  const [products, setProducts] = useState<Product[]>(loaderData?.products || []);
  const [dataSource, setDataSource] = useState<string>(loaderData?.source || "sheets");
  const [isLoading, setIsLoading] = useState<boolean>(!loaderData?.products?.length);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedScreen, setSelectedScreen] = useState<string>(search.screen || "מסך לובי מרכזי");
  const [viewMode, setViewMode] = useState<ScreenMode>(
    search.mode === "widescreen" ? "widescreen" : "tv",
  );

  // Dynamic changing transition effect based on current slide index
  const currentTransition =
    SLIDE_TRANSITION_EFFECTS[currentIndex % SLIDE_TRANSITION_EFFECTS.length];

  // Counter POS queue state
  const [dispatchQueue, setDispatchQueue] = useState<DispatchOrder[]>([]);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync mode from search params if present
  useEffect(() => {
    if (search.mode === "widescreen") {
      setViewMode("widescreen");
    }
  }, [search.mode]);

  // Fetch products strictly from Google Sheet 📦 קטלוג_מוצרים
  useEffect(() => {
    let isMounted = true;
    import("@/lib/lobby.functions")
      .then((mod) => mod.getLobbyProducts())
      .then((res) => {
        if (isMounted) {
          if (res?.products?.length) {
            setProducts(res.products);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load products from Google Sheet:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync POS queue from localStorage
  useEffect(() => {
    const updateQueue = () => {
      setDispatchQueue(readDispatchQueue());
    };
    updateQueue();
    const interval = setInterval(updateQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentProduct: Product | undefined = useMemo(() => {
    if (!products.length) return undefined;
    return products[currentIndex] ?? products[0];
  }, [products, currentIndex]);

  const slideDurationSec = currentProduct?.displayDuration || 25;

  // TV & Wide Screen Rotation Timer and Progress Bar
  useEffect(() => {
    if (isPaused || (viewMode !== "tv" && viewMode !== "widescreen") || !products.length) return;

    const intervalMs = 100;
    const stepIncrement = (intervalMs / (slideDurationSec * 1000)) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % products.length);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, slideDurationSec, products.length, viewMode]);

  // Reset progress on manual change
  const handleSelectProduct = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setProgress(0);
  };

  // Generate QR URL targeting standalone product page
  const qrUrl = useMemo(() => {
    if (!currentProduct) return "";
    const origin =
      isClient && typeof window !== "undefined"
        ? window.location.origin
        : "https://saban-smart-signage.vercel.app";
    return `${origin}/product/${currentProduct.sku}?source=lobby_qr&warehouse=auto&screen_id=${encodeURIComponent(
      selectedScreen,
    )}`;
  }, [isClient, currentProduct, selectedScreen]);

  const price = currentProduct ? effectivePrice(currentProduct) : 0;
  const hasDiscount = Boolean(
    currentProduct?.salePrice && currentProduct.salePrice < currentProduct.price,
  );

  const handleClearOrders = () => {
    clearDispatchQueue();
    setDispatchQueue([]);
    toast.info("תור ההזמנות אופס בהצלחה");
  };

  // =========================================================================
  // VIEW MODE: WIDESCREEN LOBBY SIGNAGE (מסך רחב לשילוט לובי - רקע בהיר משולב כהה ומעבר משתנה)
  // =========================================================================
  if (viewMode === "widescreen") {
    return (
      <div
        dir="rtl"
        className="fixed inset-0 w-screen h-screen bg-[#edf0f5] text-slate-900 flex flex-col justify-between overflow-hidden select-none font-sans z-50 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:26px_26px]"
      >
        {/* Top Floating Bar: Luminous Light Header with High-Contrast Dark Elements */}
        <header className="w-full px-8 py-3 flex items-center justify-between border-b border-slate-300/80 bg-white/95 backdrop-blur-md shadow-xs shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-xl shadow-md border border-amber-600/30">
              ח.ס
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black tracking-tight text-slate-950">
                  ח. סבן חומרי בניין (1994) בע״מ
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-amber-400 border border-slate-800 px-3 py-0.5 text-xs font-bold shadow-xs">
                  שילוט דיגיטלי חכם • {selectedScreen}
                </span>
                <span className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 text-slate-900 border border-amber-500/30 px-2.5 py-0.5 text-xs font-extrabold shadow-2xs">
                  <Sparkles className="size-3 text-amber-600" />
                  אפקט מעבר משתנה: {currentTransition.label}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                מרכז חומרי בניין, מליטה, ברזל, איטום וגבס • הוד השרון | שירות קבלנים ואנשי מקצוע
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Visual Effect Badge */}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-normal">אפקט:</span>
              <span className="font-bold text-slate-900">{currentTransition.label}</span>
            </div>

            {/* Quick Return to Standard View (Subtle Exit Control) */}
            <button
              type="button"
              onClick={() => setViewMode("tv")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-2xs"
              title="יציאה ממצב מסך רחב"
            >
              <Minimize2 className="size-3.5" />
              <span>יציאה ממסך רחב</span>
            </button>

            <div className="text-left font-mono text-xs font-bold bg-slate-900 text-amber-400 px-3 py-1.5 rounded-xl shadow-xs">
              {products.length > 0 ? `${currentIndex + 1}/${products.length}` : "—"}
            </div>
          </div>
        </header>

        {/* Top Subtle Slide Progress Line */}
        <div className="w-full h-1.5 bg-slate-300/80 overflow-hidden shrink-0">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 transition-all duration-100 ease-linear shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading State in Wide Screen */}
        {(!currentProduct || isLoading) && (
          <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center animate-pulse mb-6 shadow-sm">
              <Package className="size-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-950">טוען נתונים חיים מגיליון סבן...</h2>
            <p className="text-sm text-slate-500 mt-2">סנכרון ישיר מול קטלוג מוצרים הרשמי</p>
          </main>
        )}

        {/* Main Content Area: High-Impact Signage Stage with Dynamic Changing Slide Transition */}
        {currentProduct && !isLoading && (
          <main
            key={currentProduct.sku + "-" + currentIndex}
            className={`flex-1 px-8 py-5 grid grid-cols-12 gap-7 items-stretch min-h-0 overflow-hidden ${currentTransition.className} relative`}
          >
            {/* Subtle light sheen passing sweep on slide transition */}
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
              <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-sweep-shine" />
            </div>

            {/* Left 8 Columns: Hero Packaging Visual, Spec Highlights & Sheet Data Row */}
            <div className="col-span-8 flex flex-col justify-between rounded-3xl border border-slate-300/90 bg-white p-7 shadow-xl relative overflow-hidden">
              {/* Product Badge Strip */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-slate-900 text-white font-bold text-xs px-3.5 py-1.5 shadow-xs">
                    {currentProduct.category}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    מותג: <strong className="text-slate-950">{currentProduct.brand}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-amber-500 text-slate-950 px-3 py-1 rounded-xl font-black border border-amber-600/30 shadow-xs">
                    מק״ט: {currentProduct.sku}
                  </span>
                </div>
              </div>

              {/* Center Stage: High-Contrast Dark Podium for Product Photo + Details */}
              <div className="my-auto grid grid-cols-12 gap-7 items-center py-3">
                {/* Product Photo Render on High-Contrast Deep Dark Podium */}
                <div className="col-span-5 flex items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden group min-h-[300px]">
                  {/* Subtle Amber Spotlight Glow */}
                  <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <img
                      src={currentProduct.image}
                      alt={currentProduct.name}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes("/assets/product-adhesive-bag.jpg")) {
                          target.src = "/assets/product-adhesive-bag.jpg";
                        }
                      }}
                      className="max-h-[290px] w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] transition-transform duration-700 hover:scale-105"
                    />
                    {currentProduct.discountTag && (
                      <div className="absolute -top-3 -right-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs px-3.5 py-1.5 shadow-lg">
                        {currentProduct.discountTag}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Typography & Deep Contrast "Ask the Desk" Price Line */}
                <div className="col-span-7 space-y-4">
                  <h2 className="text-3xl lg:text-4xl font-black text-slate-950 leading-tight tracking-tight">
                    {currentProduct.name}
                  </h2>

                  <p className="text-base text-slate-700 leading-relaxed font-normal">
                    {currentProduct.marketingPhrase}
                  </p>

                  {/* PRICE REPLACEMENT: High-Impact Dark Contrast Box */}
                  <div className="rounded-2xl bg-slate-900 text-white p-5 border border-slate-800 shadow-xl space-y-1.5">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      מחיר ומבצעי קבלנים:
                    </span>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl lg:text-4xl font-black text-amber-400 tracking-tight">
                        שאל את הדלפק
                      </span>
                      <span className="text-sm text-slate-300 font-medium">
                        ל{currentProduct.unitLabel}{" "}
                        {currentProduct.unitWeight ? `(${currentProduct.unitWeight})` : ""}
                      </span>
                    </div>
                    <div className="text-xs text-amber-300/90 font-medium flex items-center gap-1.5 pt-0.5">
                      <Users className="size-3.5" />
                      <span>מחיר מיוחד לקבלנים בהתאמה לכמויות הפרויקט</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Highlights Quick Strip */}
              <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-200">
                <div className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-xs text-slate-500 block font-medium">כושר כיסוי</span>
                  <span className="text-lg font-black text-slate-950">
                    {currentProduct.coveragePerUnitM2} מ״ר
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    ל{currentProduct.unitLabel}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-xs text-slate-500 block font-medium">זמן פתוח / עבודה</span>
                  <span className="text-lg font-black text-slate-950 truncate block">
                    {currentProduct.openTime || currentProduct.potLife || "מיידי"}
                  </span>
                  <span className="text-[11px] text-slate-500 block">בדלי ועל מצע</span>
                </div>

                <div className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-xs text-slate-500 block font-medium">זמן ייבוש</span>
                  <span className="text-lg font-black text-slate-950 truncate block">
                    {currentProduct.dryingTime?.split(",")[0] || "24 שעות"}
                  </span>
                  <span className="text-[11px] text-slate-500 block">הליכה / שכבה הבאה</span>
                </div>

                <div className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-xs text-slate-500 block font-medium">
                    תקן ישראלי/אירופי
                  </span>
                  <span className="text-lg font-black text-slate-950 truncate block">
                    {currentProduct.standard || "תקן סבן"}
                  </span>
                  <span className="text-[11px] text-slate-500 block">בדיקות מעבדה</span>
                </div>
              </div>

              {/* SPEC DETAILS ROW FROM SHEET (Deep Contrast Banner) */}
              <div className="mt-3.5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 px-4 py-3 flex items-center justify-between gap-4 flex-wrap shadow-md">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="font-bold text-slate-950 bg-amber-500 px-2.5 py-1 rounded-lg">
                    מפרט מגליון:
                  </span>
                  <span>
                    {currentProduct.coverageNote ||
                      currentProduct.marketingPhrase ||
                      `${currentProduct.name} — תקני רשמי`}
                  </span>
                  {currentProduct.applicationMethod && (
                    <span className="text-slate-400">
                      • יישום: {currentProduct.applicationMethod}
                    </span>
                  )}
                  {currentProduct.substrates && currentProduct.substrates.length > 0 && (
                    <span className="text-slate-400">
                      • מצעים: {currentProduct.substrates.join(", ")}
                    </span>
                  )}
                </div>

                {/* CALL TO ACTION: שאל את נציג הדלפק */}
                <div className="flex items-center gap-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors">
                  <PhoneCall className="size-4 animate-bounce" />
                  <span>שאל את נציג הדלפק לפרטים מלאים והזמנה</span>
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Massive High-Contrast QR Code in Dark Contrast Tower */}
            <div className="col-span-4 flex flex-col justify-between rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-7 shadow-2xl text-center text-white relative overflow-hidden">
              {/* Corner Ambient Glow */}
              <div className="absolute top-0 right-0 size-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-2.5 relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-1.5 text-xs font-bold shadow-xs">
                  <QrCode className="size-4" />
                  <span>סריקה מהירה בנייד</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-black text-white">
                  סרוק עכשיו למפרט טכני
                </h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  פתח את מצלמת הנייד וכיוון לקוד: גישה ישירה למפרט, מחשבון כמויות וייעוץ
                </p>
              </div>

              {/* Giant QR Card */}
              <div className="my-auto flex flex-col items-center justify-center relative z-10">
                <div className="rounded-3xl bg-white p-5 shadow-2xl flex items-center justify-center border-4 border-slate-800/80">
                  {isClient ? (
                    <QRCodeSVG value={qrUrl} size={240} level="Q" includeMargin={false} />
                  ) : (
                    <div className="size-[240px] rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                      <QrCode className="size-20 opacity-40 animate-pulse" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-amber-400 mt-3 font-mono font-bold tracking-wider">
                  מק״ט: {currentProduct.sku} • {selectedScreen}
                </span>
              </div>

              {/* Bottom Large Prompt */}
              <div className="rounded-2xl bg-amber-500 text-slate-950 p-4 text-center shadow-lg font-black relative z-10">
                <p className="text-base font-black">יש לך שאלה? שאל את נציג הדלפק</p>
                <p className="text-xs text-slate-900/80 font-semibold mt-1">
                  הנציגים שלנו כאן לרשותך להתאמת חומרים, כמויות ומחיר קבלן
                </p>
              </div>
            </div>
          </main>
        )}

        {/* Bottom Ticker Line: Sleek Dark Contrast Strip */}
        <footer className="w-full px-8 py-2.5 bg-slate-900 text-slate-300 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-6">
            <span className="font-bold text-white">
              ח. סבן הוד השרון: סניף החרש 4 (מגרש ראשי) | סניף התלמיד 6 (גבס וצבע)
            </span>
            <span className="hidden md:inline text-slate-400">
              • מחיר המוצר: שאל את הדלפק לקבלת הצעת מחיר מדויקת
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="size-3" />
              מעבר: {currentTransition.label}
            </span>
            <span className="text-slate-400">החלפת שקופית כל {slideDurationSec} שניות</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#edf0f5] text-slate-900 flex flex-col font-sans selection:bg-primary/30 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:26px_26px]"
    >
      {/* Top TV & Control Bar */}
      <header className="border-b border-slate-300/80 bg-white/95 px-4 py-2.5 shadow-xs sticky top-0 z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 flex-wrap">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-xl shadow-xs border border-amber-600/30">
              ח.ס
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                  ח. סבן חומרי בניין (1994) בע״מ
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  שילוט חכם v2.4
                </span>
              </div>
              <p className="text-xs text-slate-600 hidden sm:block">
                בטון, פלדה, איטום ודבקים • יועצת טכנית דיגיטלית & שילוט סניפים
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-300/80 shadow-2xs">
            {/* WIDE SCREEN BUTTON: כפתור "מסך רחב" לשילוט לובי */}
            <button
              type="button"
              onClick={() => setViewMode("widescreen")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-xs"
              title="הצג דף מסך רחב לשילוט לובי ללא כפתורים וללא POPUP"
            >
              <Maximize2 className="size-3.5 text-slate-950" />
              <span>מסך רחב</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("tv")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "tv"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-300/80"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Tv className="size-3.5" />
              <span>מסך שילוט לובי</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("pos")}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "pos"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-300/80"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Store className="size-3.5" />
              <span>דלפק מכירות (POS)</span>
              {dispatchQueue.length > 0 && (
                <span className="size-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {dispatchQueue.length}
                </span>
              )}
            </button>

            {currentProduct ? (
              <Link
                to="/product/$sku"
                params={{ sku: currentProduct.sku }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-950 transition-all"
              >
                <Smartphone className="size-3.5" />
                <span>תצוגת נייד</span>
                <ExternalLink className="size-3 opacity-60" />
              </Link>
            ) : (
              <Link
                to="/product/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-950 transition-all"
              >
                <Smartphone className="size-3.5" />
                <span>תצוגת נייד</span>
                <ExternalLink className="size-3 opacity-60" />
              </Link>
            )}

            <PWAInstallButton />
          </div>

          {/* Sync & Location Badges */}
          <div className="flex items-center gap-2">
            {/* Transition Indicator Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 text-slate-950 border border-amber-500/30 px-2.5 py-1 text-xs font-extrabold shadow-2xs">
              <Sparkles className="size-3 text-amber-600" />
              <span>מעבר: {currentTransition.label}</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-700 shadow-2xs">
              <span
                className={`size-2 rounded-full ${
                  dataSource === "sheets" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="text-[11px] font-semibold">
                {dataSource === "sheets" ? "Google Sheets מחובר" : "גיבוי מקומי פעיל"}
              </span>
            </div>

            <select
              value={selectedScreen}
              aria-label="בחר מסך"
              onChange={(e) => setSelectedScreen(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-hidden shadow-2xs"
            >
              <option value="מסך לובי מרכזי">מסך לובי מרכזי</option>
              <option value="מחסן 4 - החרש">מחסן 4 (החרש)</option>
              <option value="מחסן 1 - התלמיד">מחסן 1 (התלמיד)</option>
              <option value="דלפק הזמנות קבלנים">דלפק הזמנות קבלנים</option>
            </select>
          </div>
        </div>

        {/* Rotation Progress Bar (Visible in TV mode) */}
        {viewMode === "tv" && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-amber-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {/* VIEW 1: LOBBY TV SIGNAGE */}
      {viewMode === "tv" && (!currentProduct || isLoading) && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[500px]">
          <div className="rounded-3xl border bg-card p-10 max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse">
              <Package className="size-8" />
            </div>
            <h3 className="text-xl font-bold">טוען קטלוג מוצרים</h3>
            <p className="text-sm text-muted-foreground">
              שולף נתונים חיים מגיליון 📦 קטלוג_מוצרים של ח. סבן...
            </p>
          </div>
        </main>
      )}

      {viewMode === "tv" && currentProduct && !isLoading && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between gap-6">
          {/* Main Hero TV Layout Grid with Dynamic Changing Slide Transition */}
          <div
            key={currentProduct.sku + "-" + currentIndex}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${currentTransition.className} relative`}
          >
            {/* Subtle light passing sweep on slide transition */}
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
              <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-sweep-shine" />
            </div>

            {/* Left/Main Column: Product Packaging Render & Badges */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-300/90 bg-white p-6 shadow-xl relative overflow-hidden">
              {/* Product Category & Brand Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-slate-900 text-white font-bold text-xs px-3 py-1 shadow-xs">
                    {currentProduct.category}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    מותג: <strong className="text-slate-950">{currentProduct.brand}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg font-black shadow-xs">
                    מק״ט: {currentProduct.sku}
                  </span>
                </div>
              </div>

              {/* Product Visual & Headline */}
              <div className="my-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Deep Dark Podium for Product Visual */}
                <div className="sm:col-span-6 flex items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden group min-h-[260px]">
                  {/* Subtle Amber Spotlight Glow */}
                  <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <img
                      src={currentProduct.image}
                      alt={currentProduct.name}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes("/assets/product-adhesive-bag.jpg")) {
                          target.src = "/assets/product-adhesive-bag.jpg";
                        }
                      }}
                      className="max-h-64 w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-105"
                    />
                    {currentProduct.discountTag && (
                      <div className="absolute -top-3 -right-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 shadow-md">
                        {currentProduct.discountTag}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-6 space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
                    {currentProduct.name}
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {currentProduct.marketingPhrase}
                  </p>

                  {/* Pricing Box - High Impact Deep Dark Contrast */}
                  <div className="rounded-2xl bg-slate-900 text-white p-4 border border-slate-800 space-y-1 shadow-xl">
                    <span className="text-xs font-bold text-amber-400 block">
                      מחיר קבלנים ומבצע:
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400">
                        שאל את הדלפק
                      </span>
                      <span className="text-xs text-slate-300">
                        ל{currentProduct.unitLabel} ({currentProduct.unitWeight})
                      </span>
                    </div>
                    <div className="text-xs text-amber-300/80 font-medium">
                      פנה לנציג הדלפק לקבלת מחיר מעודכן ומבצעי כמויות
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Highlights Quick Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-200">
                <div className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-[11px] text-slate-500 block font-medium">כושר כיסוי</span>
                  <span className="text-base font-black text-slate-950">
                    {currentProduct.coveragePerUnitM2} מ״ר
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ל{currentProduct.unitLabel}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-[11px] text-slate-500 block font-medium">
                    זמן פתוח / עבודה
                  </span>
                  <span className="text-base font-black text-slate-950 truncate block">
                    {currentProduct.openTime || currentProduct.potLife || "מיידי"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">בדלי ועל מצע</span>
                </div>

                <div className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-[11px] text-slate-500 block font-medium">זמן ייבוש</span>
                  <span className="text-base font-black text-slate-950 truncate block">
                    {currentProduct.dryingTime?.split(",")[0] || "24 שעות"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">הליכה / שכבה הבאה</span>
                </div>

                <div className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-[11px] text-slate-500 block font-medium">
                    תקן ישראלי/אירופי
                  </span>
                  <span className="text-base font-black text-slate-950 truncate block">
                    {currentProduct.standard || "תקן סבן"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">בדיקות מעבדה</span>
                </div>
              </div>

              {/* Row from Product Details Sheet with Call to Action to Desk Rep */}
              <div className="mt-3 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 p-3 flex items-center justify-between gap-3 flex-wrap shadow-md">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="font-bold text-slate-950 bg-amber-500 px-2 py-0.5 rounded-md">
                    מפרט מוצר:
                  </span>
                  <span className="text-slate-200">
                    {currentProduct.coverageNote || currentProduct.marketingPhrase}
                  </span>
                </div>
                <div className="text-xs font-black text-slate-950 bg-amber-400 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-xs">
                  <PhoneCall className="size-3.5" />
                  <span>שאל את נציג הדלפק</span>
                </div>
              </div>
            </div>

            {/* Right Column: Giant QR Code & Mobile Prompt on Deep Contrast Dark Backdrop */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="space-y-2 text-center relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-bold shadow-xs">
                  <QrCode className="size-4" />
                  <span>סריקה מהירה בנייד</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  סרוק עכשיו למפרט ומחשבון
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                  פתח את מצלמת הטלפון וכיוון לקוד: גישה ישירה למחשבון כמויות, ייעוץ עם נועה וסגירת
                  הזמנה לדלפק
                </p>
              </div>

              {/* QR Code Container with High-Contrast White Card */}
              <div className="my-6 flex flex-col items-center justify-center relative z-10">
                <div className="rounded-3xl bg-white p-5 shadow-2xl flex items-center justify-center min-w-[260px] min-h-[260px] border-4 border-slate-800/80">
                  {isClient ? (
                    <QRCodeSVG value={qrUrl} size={220} level="Q" includeMargin={false} />
                  ) : (
                    <div className="size-[220px] rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                      <QrCode className="size-16 opacity-40 animate-pulse" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-amber-400 mt-3 font-mono font-bold">
                  {currentProduct.sku} • {selectedScreen}
                </span>
              </div>

              {/* Action Buttons for Screen User / Touchscreen */}
              <div className="space-y-2 relative z-10">
                <Link
                  to="/product/$sku"
                  params={{ sku: currentProduct.sku }}
                  className="w-full h-12 rounded-2xl font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg"
                >
                  <Smartphone className="size-4" />
                  <span>פתח דף מוצר אינטראקטיבי בנייד</span>
                </Link>

                <p className="text-[11px] text-center text-slate-400">
                  נציגת שירות ויועצת טכנית של סבן (נועה 💭) זמינה בכל רגע בצ׳אט
                </p>
              </div>
            </div>
          </div>

          {/* Sub-strip: Mandatory Companion Products (מוצרים משלימים מחייבים) */}
          {currentProduct.companions?.length > 0 && (
            <div className="rounded-3xl border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-xs">
                    <Layers className="size-4" />
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    מוצרים משלימים מומלצים עבור {currentProduct.name}
                  </h4>
                </div>
                <span className="text-xs text-muted-foreground">
                  מונע טעויות יישום ומבטיח אחריות יצרן מלאה
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentProduct.companions.map((comp, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border bg-muted/40 p-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-foreground">{comp.name}</span>
                        {comp.sku && (
                          <span className="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">
                            {comp.sku}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{comp.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom TV Carousel Controls & Slide Thumbnails */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-card border rounded-3xl p-3 px-5 shadow-xs">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="size-10 rounded-xl"
                title="שקופית קודמת"
              >
                <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPaused((p) => !p)}
                className="size-10 rounded-xl"
                title={isPaused ? "הפעל רוטציה אוטומטית" : "עצור רוטציה"}
              >
                {isPaused ? <Play className="size-4 text-primary" /> : <Pause className="size-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="size-10 rounded-xl"
                title="שקופית הבאה"
              >
                <ArrowLeft className="size-4" />
              </Button>

              <span className="text-xs font-semibold text-muted-foreground mr-2">
                מוצר {currentIndex + 1} מתוך {products.length} ({slideDurationSec} שניות לשקופית)
              </span>
            </div>

            {/* Slide Indicators / Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {products.map((p, idx) => (
                <button
                  key={p.sku}
                  type="button"
                  onClick={() => handleSelectProduct(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    idx === currentIndex
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                  }`}
                >
                  <span>{p.sku}</span>
                  <span className="truncate max-w-[90px]">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: COUNTER POS & DISPATCH QUEUE */}
      {viewMode === "pos" && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Store className="size-6 text-primary" />
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  עמדת דלפק מכירות — סנכרון סריקות והזמנות מהלובי
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                הזמנות שנשלחו ע״י קבלנים ולקוחות מסריקת קוד ה-QR במסכי הלובי והמחסן
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleClearOrders}
                disabled={dispatchQueue.length === 0}
                className="rounded-2xl text-xs flex items-center gap-1.5 h-10"
              >
                <Trash2 className="size-3.5" />
                <span>נקה תור הזמנות</span>
              </Button>
            </div>
          </div>

          {dispatchQueue.length === 0 ? (
            <div className="rounded-3xl border bg-card p-12 text-center space-y-4">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Store className="size-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">אין הזמנות חדשות בתור</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  כאשר לקוח סורק את ה-QR במסך הלובי ולוחץ על ״שדר לדלפק המכירות״, ההזמנה תופיע כאן
                  מיידית להכנה ולליקוט.
                </p>
              </div>
              <Button
                onClick={() => setViewMode("tv")}
                className="rounded-2xl font-bold bg-primary text-primary-foreground"
              >
                חזור למסך השילוט
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dispatchQueue.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl border bg-card p-5 shadow-xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-muted-foreground block">
                        קוד פנייה: {order.id}
                      </span>
                      <h4 className="font-bold text-base text-foreground mt-0.5">
                        {order.productName}
                      </h4>
                      <span className="text-xs font-mono font-bold text-primary">
                        מק״ט: {order.sku}
                      </span>
                    </div>

                    <span className="rounded-full bg-success/15 text-success text-[10px] font-bold px-2 py-0.5">
                      חדש מהלובי
                    </span>
                  </div>

                  <div className="rounded-2xl bg-muted/50 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">כמות מבוקשת:</span>
                      <span className="font-bold text-foreground">
                        {order.quantity} {order.unitLabel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">עלות מוערכת:</span>
                      <span className="font-bold text-primary">
                        ₪{order.estimatedCost.toLocaleString()}
                      </span>
                    </div>
                    {order.note && (
                      <p className="text-xs text-muted-foreground pt-1 border-t mt-1">
                        {order.note}
                      </p>
                    )}
                  </div>

                  {/* Warehouse Location Hint */}
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      מיקום: <strong>מחסן 4 (החרש)</strong> • שורה ג׳
                    </span>
                    <span className="text-[10px]">
                      {new Date(order.createdAt).toLocaleTimeString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href={whatsappLink(
                        `שלום, לגבי פנייתך לדלפק סבן על ${order.productName} (כמות: ${order.quantity}). ההזמנה מוכנה לאיסוף.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-9 rounded-xl bg-success text-success-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-success/90"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>שוחח בוואטסאפ</span>
                    </a>

                    <Link
                      to="/product/$sku"
                      params={{ sku: order.sku }}
                      className="h-9 px-3 rounded-xl border border-input text-xs font-semibold flex items-center justify-center hover:bg-muted"
                      title="צפה במפרט המלא של המוצר"
                    >
                      מפרט
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Floating Noa AI Assistant Widget */}
      <NoaChat product={currentProduct} screenId={selectedScreen} />
    </div>
  );
}
