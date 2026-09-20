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
  MessageCircle,
  Package,
  Pause,
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
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { NoaChat } from "@/components/noa/NoaChat";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";
import { Button } from "@/components/ui/button";
import {
  clearDispatchQueue,
  DispatchOrder,
  readDispatchQueue,
  whatsappLink,
} from "@/lib/counter-dispatch";
import { effectivePrice, findProduct, MASTER_PRODUCTS, type Product } from "@/lib/products";

export const Route = createFileRoute("/")({
  component: Index,
});

type ScreenMode = "tv" | "pos";

export function Index() {
  const navigate = useNavigate();

  // Active products list
  const [products, setProducts] = useState<Product[]>(MASTER_PRODUCTS);
  const [dataSource, setDataSource] = useState<"sheets" | "fallback">("fallback");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedScreen, setSelectedScreen] = useState<string>("מסך לובי מרכזי");
  const [viewMode, setViewMode] = useState<ScreenMode>("tv");

  // Counter POS queue state
  const [dispatchQueue, setDispatchQueue] = useState<DispatchOrder[]>([]);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch cached products from lobby server function if available
  useEffect(() => {
    let isMounted = true;
    import("@/lib/lobby.functions")
      .then((mod) => mod.getLobbyProducts())
      .then((res) => {
        if (isMounted && res?.products?.length) {
          setProducts(res.products);
          setDataSource(res.source);
        }
      })
      .catch(() => {
        // Fallback to local master products
        if (isMounted) {
          setProducts(MASTER_PRODUCTS);
          setDataSource("fallback");
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

  const currentProduct: Product = useMemo(() => {
    return products[currentIndex] ?? products[0] ?? MASTER_PRODUCTS[0]!;
  }, [products, currentIndex]);

  const slideDurationSec = currentProduct.displayDuration || 25;

  // TV Rotation Timer and Progress Bar
  useEffect(() => {
    if (isPaused || viewMode !== "tv") return;

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
    const origin =
      isClient && typeof window !== "undefined"
        ? window.location.origin
        : "https://saban-smart-signage.vercel.app";
    return `${origin}/product/${currentProduct.sku}?source=lobby_qr&warehouse=auto&screen_id=${encodeURIComponent(
      selectedScreen,
    )}`;
  }, [isClient, currentProduct.sku, selectedScreen]);

  const price = effectivePrice(currentProduct);
  const hasDiscount = currentProduct.salePrice && currentProduct.salePrice < currentProduct.price;

  const handleClearOrders = () => {
    clearDispatchQueue();
    setDispatchQueue([]);
    toast.info("תור ההזמנות אופס בהצלחה");
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30"
    >
      {/* Top TV & Control Bar */}
      <header className="border-b bg-card px-4 py-2.5 shadow-xs sticky top-0 z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 flex-wrap">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-xs">
              ח.ס
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  ח. סבן חומרי בניין (1994) בע״מ
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  שילוט חכם v2.4
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                בטון, פלדה, איטום ודבקים • יועצת טכנית דיגיטלית & שילוט סניפים
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl border">
            <button
              type="button"
              onClick={() => setViewMode("tv")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "tv"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
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
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="size-3.5" />
              <span>דלפק מכירות (POS)</span>
              {dispatchQueue.length > 0 && (
                <span className="size-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {dispatchQueue.length}
                </span>
              )}
            </button>

            <Link
              to="/product/$sku"
              params={{ sku: currentProduct.sku }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              <Smartphone className="size-3.5" />
              <span>תצוגת נייד</span>
              <ExternalLink className="size-3 opacity-60" />
            </Link>

            <PWAInstallButton />
          </div>

          {/* Sync & Location Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-card border px-2.5 py-1 text-xs text-muted-foreground">
              <span
                className={`size-2 rounded-full ${
                  dataSource === "sheets" ? "bg-success animate-pulse" : "bg-primary"
                }`}
              />
              <span className="text-[11px] font-medium">
                {dataSource === "sheets" ? "Google Sheets מחובר" : "גיבוי מקומי פעיל"}
              </span>
            </div>

            <select
              value={selectedScreen}
              aria-label="בחר מסך"
              onChange={(e) => setSelectedScreen(e.target.value)}
              className="rounded-xl border border-input bg-card px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-hidden"
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
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {/* VIEW 1: LOBBY TV SIGNAGE */}
      {viewMode === "tv" && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between gap-6">
          {/* Main Hero TV Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left/Main Column: Product Packaging Render & Badges */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border bg-card p-6 shadow-sm relative overflow-hidden">
              {/* Product Category & Brand Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-primary/20 text-primary font-bold text-xs px-3 py-1">
                    {currentProduct.category}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    מותג: {currentProduct.brand}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-signage text-signage-foreground px-2.5 py-1 rounded-lg font-bold">
                    מק״ט: {currentProduct.sku}
                  </span>
                </div>
              </div>

              {/* Product Visual & Headline */}
              <div className="my-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-6 flex items-center justify-center p-4">
                  <div className="relative group">
                    <img
                      src={currentProduct.image}
                      alt={currentProduct.name}
                      className="max-h-72 w-auto object-contain drop-shadow-xl transition-transform duration-500 hover:scale-105"
                    />
                    {currentProduct.discountTag && (
                      <div className="absolute -top-3 -right-2 rounded-2xl bg-primary text-primary-foreground font-black text-xs px-3.5 py-1.5 shadow-md">
                        {currentProduct.discountTag}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-6 space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">
                    {currentProduct.name}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentProduct.marketingPhrase}
                  </p>

                  {/* Pricing Box */}
                  <div className="rounded-2xl bg-muted/60 p-4 border space-y-1">
                    <span className="text-xs font-bold text-muted-foreground block">
                      מחיר קבלנים ומבצע:
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl sm:text-4xl font-black text-foreground">
                        ₪{price}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ל{currentProduct.unitLabel} ({currentProduct.unitWeight})
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="text-xs text-muted-foreground">
                        מחיר מחירון רגיל:{" "}
                        <span className="line-through">₪{currentProduct.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Highlights Quick Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t">
                <div className="rounded-2xl bg-muted/40 p-3 text-center">
                  <span className="text-[11px] text-muted-foreground block">כושר כיסוי</span>
                  <span className="text-base font-bold text-foreground">
                    {currentProduct.coveragePerUnitM2} מ״ר
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    ל{currentProduct.unitLabel}
                  </span>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3 text-center">
                  <span className="text-[11px] text-muted-foreground block">זמן פתוח / עבודה</span>
                  <span className="text-base font-bold text-foreground truncate block">
                    {currentProduct.openTime || currentProduct.potLife || "מיידי"}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">בדלי ועל מצע</span>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3 text-center">
                  <span className="text-[11px] text-muted-foreground block">זמן ייבוש</span>
                  <span className="text-base font-bold text-foreground truncate block">
                    {currentProduct.dryingTime?.split(",")[0] || "24 שעות"}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">הליכה / שכבה הבאה</span>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3 text-center">
                  <span className="text-[11px] text-muted-foreground block">תקן ישראלי/אירופי</span>
                  <span className="text-base font-bold text-foreground truncate block">
                    {currentProduct.standard || "תקן סבן"}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">בדיקות מעבדה</span>
                </div>
              </div>
            </div>

            {/* Right Column: Giant QR Code & Mobile Prompt */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border bg-signage text-signage-foreground p-6 sm:p-8 shadow-sm">
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 text-primary px-3 py-1 text-xs font-bold">
                  <QrCode className="size-4" />
                  <span>סריקה מהירה בנייד</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">סרוק עכשיו למפרט ומחשבון</h3>
                <p className="text-xs sm:text-sm text-signage-muted max-w-sm mx-auto">
                  פתח את מצלמת הטלפון וכיוון לקוד: גישה ישירה למחשבון כמויות, ייעוץ עם נועה וסגירת
                  הזמנה לדלפק
                </p>
              </div>

              {/* QR Code Container with High-Contrast White Card */}
              <div className="my-6 flex flex-col items-center justify-center">
                <div className="rounded-3xl bg-white p-5 shadow-xl flex items-center justify-center min-w-[260px] min-h-[260px]">
                  {isClient ? (
                    <QRCodeSVG value={qrUrl} size={220} level="Q" includeMargin={false} />
                  ) : (
                    <div className="size-[220px] rounded-2xl bg-neutral-100/80 flex items-center justify-center text-neutral-400">
                      <QrCode className="size-16 opacity-40 animate-pulse" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-signage-muted mt-3 font-mono">
                  {currentProduct.sku} • {selectedScreen}
                </span>
              </div>

              {/* Action Buttons for Screen User / Touchscreen */}
              <div className="space-y-2">
                <Link
                  to="/product/$sku"
                  params={{ sku: currentProduct.sku }}
                  className="w-full h-12 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-sm"
                >
                  <Smartphone className="size-4" />
                  <span>פתח דף מוצר אינטראקטיבי בנייד</span>
                </Link>

                <p className="text-[11px] text-center text-signage-muted">
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
