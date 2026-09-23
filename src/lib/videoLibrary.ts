import { LobbyVideoItem, VideoLibrarySettings } from "../types/video";

export const DEFAULT_LOBBY_VIDEOS: LobbyVideoItem[] = [
  {
    id: "saban-builders",
    title: "ח. סבן • אתר הבנייה בתלת-ממד",
    subtitle: "עולם המלט, הבטון, הפלדה והמשאיות של ח. סבן (1994) בע״מ",
    category: "תדמית ומיתוג",
    videoSrc: "/videos/saban-builders.mp4",
    posterSrc: "/videos/saban-builders.jpg",
    durationSec: 7,
    branch: "סניף החרש 4 - מגרש ראשי",
    enabled: true,
  },
  {
    id: "saban-app-splash",
    title: "אפליקציית סבן החדשה • מהפכת שירות",
    subtitle: "הזמנות קבלנים, מחשבוני כמויות וסגירת עגלות ישירות לדלפק",
    category: "אפליקציה ודיגיטל",
    videoSrc: "/videos/saban-app-splash.mp4",
    posterSrc: "/videos/saban-app-splash.jpg",
    durationSec: 7,
    branch: "כל הסניפים",
    enabled: true,
  },
  {
    id: "saban-drywall",
    title: "מערכות גבס ובידוד תרמי ואקוסטי • אורבונד",
    subtitle: "לוחות גבס, צמר סלעים, פרופילים וברגים ייעודיים",
    category: "גבס ובידוד",
    videoSrc: "/videos/saban-drywall.mp4",
    posterSrc: "/videos/saban-drywall.jpg",
    durationSec: 7,
    branch: "סניף התלמיד 6 - אולם גבס",
    enabled: true,
  },
  {
    id: "saban-noa-ai",
    title: "הכירו את נועה • מוח שירות וייעוץ דיגיטלי",
    subtitle: "ייעוץ מפרטים, תיאום משאיות מנוף וסדרנות חכמה באתר",
    category: "שירות ודלפק",
    videoSrc: "/videos/saban-noa-ai.mp4",
    posterSrc: "/videos/saban-noa-ai.jpg",
    durationSec: 7,
    branch: "שירות לקוחות ודלפק",
    enabled: true,
  },
];

const SETTINGS_KEY = "saban_lobby_video_settings_v1";
const VIDEOS_STORAGE_KEY = "saban_lobby_videos_custom_v1";

export const DEFAULT_VIDEO_SETTINGS: VideoLibrarySettings = {
  enableVideoInterludes: true,
  videoIntervalSlides: 2, // מעבר במסך מלא בין כל 2 שקופיות מוצר!
  videoAudioMuted: true, // תאימות להפעלה אוטומטית בדפדפן
  autoSkipWhenEnded: true,
  aspectMode: "cover",
};

export function getStoredVideoSettings(): VideoLibrarySettings {
  if (typeof window === "undefined") return DEFAULT_VIDEO_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_VIDEO_SETTINGS;
    return { ...DEFAULT_VIDEO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VIDEO_SETTINGS;
  }
}

export function saveStoredVideoSettings(settings: Partial<VideoLibrarySettings>): VideoLibrarySettings {
  if (typeof window === "undefined") return DEFAULT_VIDEO_SETTINGS;
  const current = getStoredVideoSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed saving video settings", err);
  }
  return updated;
}

export function getStoredVideos(): LobbyVideoItem[] {
  if (typeof window === "undefined") return DEFAULT_LOBBY_VIDEOS;
  try {
    const raw = localStorage.getItem(VIDEOS_STORAGE_KEY);
    if (!raw) return DEFAULT_LOBBY_VIDEOS;
    const parsed = JSON.parse(raw) as LobbyVideoItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LOBBY_VIDEOS;
    return parsed;
  } catch {
    return DEFAULT_LOBBY_VIDEOS;
  }
}

export function saveStoredVideos(videos: LobbyVideoItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));
  } catch (err) {
    console.error("Failed saving stored videos", err);
  }
}

export function addCustomUploadedVideo(video: Omit<LobbyVideoItem, "id">): LobbyVideoItem {
  const all = getStoredVideos();
  const newItem: LobbyVideoItem = {
    ...video,
    id: `custom-video-${Date.now()}`,
    isCustomUpload: true,
    addedAt: new Date().toISOString(),
  };
  const updated = [newItem, ...all];
  saveStoredVideos(updated);
  return newItem;
}

export function toggleVideoStatus(id: string): LobbyVideoItem[] {
  const all = getStoredVideos();
  const updated = all.map((v) => (v.id === id ? { ...v, enabled: !v.enabled } : v));
  saveStoredVideos(updated);
  return updated;
}

export function resetVideosToDefault(): LobbyVideoItem[] {
  saveStoredVideos(DEFAULT_LOBBY_VIDEOS);
  return DEFAULT_LOBBY_VIDEOS;
}
