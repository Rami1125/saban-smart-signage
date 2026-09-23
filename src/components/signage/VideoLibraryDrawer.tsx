import React, { useState } from "react";
import {
  LobbyVideoItem,
  VideoLibrarySettings,
} from "../../types/video";
import {
  Film,
  Play,
  Upload,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  FolderVideo,
  MonitorPlay,
  Layers,
  Clock,
} from "lucide-react";
import {
  toggleVideoStatus,
  saveStoredVideoSettings,
  addCustomUploadedVideo,
  resetVideosToDefault,
} from "../../lib/videoLibrary";

interface VideoLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videos: LobbyVideoItem[];
  settings: VideoLibrarySettings;
  onUpdateVideos: (updated: LobbyVideoItem[]) => void;
  onUpdateSettings: (settings: VideoLibrarySettings) => void;
  onPlayVideoNow: (video: LobbyVideoItem) => void;
}

export const VideoLibraryDrawer: React.FC<VideoLibraryDrawerProps> = ({
  isOpen,
  onClose,
  videos,
  settings,
  onUpdateVideos,
  onUpdateSettings,
  onPlayVideoNow,
}) => {
  const [activeTab, setActiveTab] = useState<"library" | "settings" | "upload">("library");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState<LobbyVideoItem["category"]>("תדמית ומיתוג");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const updated = toggleVideoStatus(id);
    onUpdateVideos(updated);
  };

  const handleCadenceChange = (val: number) => {
    const updated = saveStoredVideoSettings({ videoIntervalSlides: val });
    onUpdateSettings(updated);
  };

  const handleInterludesToggle = () => {
    const updated = saveStoredVideoSettings({
      enableVideoInterludes: !settings.enableVideoInterludes,
    });
    onUpdateSettings(updated);
  };

  const handleMuteToggle = () => {
    const updated = saveStoredVideoSettings({
      videoAudioMuted: !settings.videoAudioMuted,
    });
    onUpdateSettings(updated);
  };

  const handleAspectToggle = () => {
    const next = settings.aspectMode === "cover" ? "contain" : "cover";
    const updated = saveStoredVideoSettings({ aspectMode: next });
    onUpdateSettings(updated);
  };

  const handleResetDefaults = () => {
    if (confirm("האם לאפס את ספריית הוידאו לברירות המחדל של סבן?")) {
      const reset = resetVideosToDefault();
      onUpdateVideos(reset);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setUploadError("יש לבחור קובץ וידאו חוקי מסוג MP4 או WebM");
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      const title = uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, "");
      const newVideo = addCustomUploadedVideo({
        title,
        subtitle: `קובץ מקומי: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`,
        category: uploadCategory,
        videoSrc: objectUrl,
        posterSrc: "/videos/saban-builders.jpg",
        durationSec: 8,
        branch: "סניף מקומי",
        enabled: true,
      });

      const updated = [...videos, newVideo];
      onUpdateVideos(updated);
      setUploadSuccess(`הקובץ "${title}" נוסף בהצלחה למאגר הווידאו!`);
      setUploadTitle("");
    } catch {
      setUploadError("שגיאה בטעינת קובץ הווידאו");
    }
  };

  const enabledCount = videos.filter((v) => v.enabled).length;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto font-sans"
    >
      <div className="relative w-full max-w-4xl rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Modal Header */}
        <header className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Film className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-950 tracking-tight">
                  ספריית וידאו שילוט לובי • ח. סבן
                </h2>
                <span className="rounded-full bg-slate-900 text-amber-400 px-2.5 py-0.5 text-xs font-bold">
                  {enabledCount} סרטונים פעילים
                </span>
              </div>
              <p className="text-xs text-slate-600">
                ניגון סרטוני תדמית מתוך התיקייה במסך מלא במעבר בין שקופיות מוצר
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "library"
                ? "border-amber-500 text-slate-950 bg-amber-50/50"
                : "border-transparent text-slate-600 hover:text-slate-950"
            }`}
          >
            <FolderVideo className="size-4 text-amber-600" />
            <span>ספריית הסרטונים במאגר ({videos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "settings"
                ? "border-amber-500 text-slate-950 bg-amber-50/50"
                : "border-transparent text-slate-600 hover:text-slate-950"
            }`}
          >
            <Sliders className="size-4 text-amber-600" />
            <span>הגדרות מעבר בין שקופיות</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "upload"
                ? "border-amber-500 text-slate-950 bg-amber-50/50"
                : "border-transparent text-slate-600 hover:text-slate-950"
            }`}
          >
            <Upload className="size-4 text-amber-600" />
            <span>הוספת סרטון מקומי</span>
          </button>
        </div>

        {/* Tab 1: Video Collection Gallery */}
        {activeTab === "library" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-amber-600 shrink-0" />
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  <strong>מצב פעיל:</strong> הסרטונים מנוגנים במסך מלא בין כל{" "}
                  <strong className="text-amber-700">{settings.videoIntervalSlides} שקופיות מוצר</strong>.
                  ניתן לבחור אילו סרטונים ייכללו בסבב או ללחוץ על "נגן עכשיו" להקרנה מיידית.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-300 shadow-2xs"
                title="אפס לסרטוני ברירת המחדל של סבן"
              >
                <RotateCcw className="size-3.5" />
                <span>איפוס</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                    vid.enabled
                      ? "border-slate-300 bg-white shadow-sm hover:border-amber-500"
                      : "border-slate-200 bg-slate-50 opacity-60"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Thumbnail & Poster */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 group">
                      <img
                        src={vid.posterSrc}
                        alt={vid.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            onPlayVideoNow(vid);
                            onClose();
                          }}
                          className="size-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95"
                          title="הפעל סרטון זה במסך מלא"
                        >
                          <Play className="size-5 fill-slate-950 mr-0.5" />
                        </button>
                      </div>

                      {/* Duration Badge */}
                      <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/80 text-white font-mono text-[11px] font-bold px-2 py-0.5 backdrop-blur-xs">
                        00:0{vid.durationSec}
                      </span>

                      {/* Category Badge */}
                      <span className="absolute top-2 right-2 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 shadow-xs">
                        {vid.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-950">{vid.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">{vid.subtitle}</p>
                      <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">
                        מיקום: {vid.branch}
                      </span>
                    </div>
                  </div>

                  {/* Card Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggle(vid.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                        vid.enabled
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>{vid.enabled ? "פעיל ברוטציה" : "מושהה"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onPlayVideoNow(vid);
                        onClose();
                      }}
                      className="text-xs font-black text-slate-900 hover:text-amber-600 flex items-center gap-1"
                    >
                      <MonitorPlay className="size-3.5" />
                      <span>נגן עכשיו במסך מלא</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Settings for Interval Cadence & Playback */}
        {activeTab === "settings" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Setting: Enable Video Interludes */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-950">
                  הפעלת סרטוני וידאו במסך שילוט הלובי
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  הקרנת סרטוני תדמית מרהיבים במסך מלא בין שקופיות המוצרים
                </p>
              </div>
              <button
                type="button"
                onClick={handleInterludesToggle}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                  settings.enableVideoInterludes
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {settings.enableVideoInterludes ? "פעיל" : "כבוי"}
              </button>
            </div>

            {/* Setting: Cadence Interval */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-900 block">
                תדירות ניגון: כל כמה שקופיות מוצר יוצג סרטון במסך מלא?
              </label>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 1, label: "כל שקופית אחת", desc: "סרטון אחרי כל מוצר" },
                  { value: 2, label: "כל 2 שקופיות", desc: "ברירת המחדל המומלצת" },
                  { value: 3, label: "כל 3 שקופיות", desc: "מרווח עדין ומאוזן" },
                  { value: 4, label: "כל 4 שקופיות", desc: "דגש מקסימלי למוצרים" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleCadenceChange(item.value)}
                    className={`rounded-2xl p-4 border text-center transition-all ${
                      settings.videoIntervalSlides === item.value
                        ? "border-amber-500 bg-amber-50 text-slate-950 font-black shadow-xs ring-2 ring-amber-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className="text-base font-black block">{item.label}</span>
                    <span className="text-[11px] text-slate-500 mt-1 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Setting: Audio */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-950">מצב סאונד ברירת מחדל</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  השתקה אוטומטית מאפשרת ניגון רציף ואוטומטי בכל דפדפן ומסך לובי ללא חסימת Autoplay
                </p>
              </div>

              <button
                type="button"
                onClick={handleMuteToggle}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                {settings.videoAudioMuted ? (
                  <>
                    <VolumeX className="size-4 text-slate-600" />
                    <span>מושתק כברירת מחדל</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="size-4 text-emerald-600" />
                    <span>סאונד פעיל</span>
                  </>
                )}
              </button>
            </div>

            {/* Setting: Aspect Mode */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-950">יחס מתיחה במסך מלא</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  מילוי מסך מלא (Cover) או שמירה על יחס המקור (Contain)
                </p>
              </div>

              <button
                type="button"
                onClick={handleAspectToggle}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                {settings.aspectMode === "cover" ? "מילוי מסך מלא (Cover)" : "התאמת שוליים (Contain)"}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Local File Upload */}
        {activeTab === "upload" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center space-y-3">
              <div className="size-14 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                <Upload className="size-7" />
              </div>
              <h3 className="text-base font-black text-slate-950">
                טעינת קובץ וידאו מקומי מהמחשב
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                בחר קובץ MP4 או WebM מהמחשב שלך. הקובץ יישמר במאגר המקומי ויוכל להשתלב ברוטציית מסכי השילוט של סבן.
              </p>

              <div className="max-w-md mx-auto space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="כותרת הסרטון (לדוגמה: מבצע טיט ורובה לחג)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:border-amber-500"
                />

                <select
                  value={uploadCategory}
                  onChange={(e) =>
                    setUploadCategory(e.target.value as LobbyVideoItem["category"])
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden focus:border-amber-500 bg-white"
                >
                  <option value="תדמית ומיתוג">תדמית ומיתוג</option>
                  <option value="אפליקציה ודיגיטל">אפליקציה ודיגיטל</option>
                  <option value="גבס ובידוד">גבס ובידוד</option>
                  <option value="שירות ודלפק">שירות ודלפק</option>
                  <option value="מותאם אישית">מותאם אישית</option>
                </select>

                <label className="block cursor-pointer">
                  <span className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs">
                    <FolderVideo className="size-4" />
                    <span>בחר קובץ MP4 / WebM להעלאה</span>
                  </span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadError && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-red-600 pt-2">
                  <AlertCircle className="size-4" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 pt-2">
                  <CheckCircle2 className="size-4" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <footer className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">תיקיית מאגר מקומית:</span>
            <code className="bg-slate-200 px-2 py-0.5 rounded-md font-mono text-[11px] text-slate-800">
              /public/videos/
            </code>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            סגור וחזור למסך
          </button>
        </footer>
      </div>
    </div>
  );
};
