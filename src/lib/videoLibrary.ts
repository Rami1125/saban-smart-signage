import { LobbyVideoItem, VideoLibrarySettings } from "../types/video";

export const GOOGLE_DRIVE_FOLDER_ID = "1wU24Ewz03bzCDga2UpYCo0EJqePbdDVf";
export const GOOGLE_DRIVE_FOLDER_NAME = "סרטונים";

/**
 * Builds direct streaming and preview URLs for files stored in Google Drive
 */
export function getGoogleDriveStreamUrl(fileId: string): string {
  // Direct Google user content streaming endpoint
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

export function getGoogleDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getGoogleDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export const DEFAULT_LOBBY_VIDEOS: LobbyVideoItem[] = [
  {
    id: "saban-builders",
    title: "ח. סבן • צי משאיות מנוף ואתר הבנייה",
    subtitle: "מרצדס מנוף 615-41-002 ואיסוזו פלטה 651-51-701 — ח. סבן (1994) בע״מ",
    category: "תדמית ומיתוג",
    videoSrc: "/videos/saban-builders.mp4",
    posterSrc: "/videos/saban-builders.jpg",
    durationSec: 12,
    branch: "סניף החרש 4 - מגרש ראשי",
    enabled: true,
    driveFileId: "1wU24Ewz03bzCDga2UpYCo0EJqePbdDVf_clip1",
    sourceType: "local",
    fallbackSrc: "/videos/saban-builders.mp4",
  },
  {
    id: "saban-app-splash",
    title: "מהפכת שירות בדלפק • אפליקציית סבן 2026",
    subtitle: "הזמנות קבלנים בלחיצה, מחשבוני כמויות וסגירת עגלות ישירות לדלפק",
    category: "אפליקציה ודיגיטל",
    videoSrc: "/videos/saban-app-splash.mp4",
    posterSrc: "/videos/saban-app-splash.jpg",
    durationSec: 10,
    branch: "כל הסניפים",
    enabled: true,
    driveFileId: "1wU24Ewz03bzCDga2UpYCo0EJqePbdDVf_clip2",
    sourceType: "local",
    fallbackSrc: "/videos/saban-app-splash.mp4",
  },
  {
    id: "saban-drywall",
    title: "מערכות גבס, שפכטל ובידוד מתקדם • אורבונד וסבן",
    subtitle: "לוחות גבס עמידי מים, צמר סלעים, פרופילי פלדה וברגי גבס בסניף התלמיד 6",
    category: "גבס ובידוד",
    videoSrc: "/videos/saban-drywall.mp4",
    posterSrc: "/videos/saban-drywall.jpg",
    durationSec: 14,
    branch: "סניף התלמיד 6 - אולם גבס וצבע",
    enabled: true,
    driveFileId: "1wU24Ewz03bzCDga2UpYCo0EJqePbdDVf_clip3",
    sourceType: "local",
    fallbackSrc: "/videos/saban-drywall.mp4",
  },
  {
    id: "saban-noa-ai",
    title: "הכירו את נועה • מוח שירות וייעוץ דיגיטלי חכם",
    subtitle: "ייעוץ מפרטים טכניים, חישוב כמויות מליטה ואיסוף עצמי מהיר",
    category: "שירות ודלפק",
    videoSrc: "/videos/saban-noa-ai.mp4",
    posterSrc: "/videos/saban-noa-ai.jpg",
    durationSec: 12,
    branch: "דלפק מכירות ושירות לקוחות",
    enabled: true,
    driveFileId: "1wU24Ewz03bzCDga2UpYCo0EJqePbdDVf_clip4",
    sourceType: "local",
    fallbackSrc: "/videos/saban-noa-ai.mp4",
  },
];

const SETTINGS_KEY = "saban_lobby_video_settings_v2";
const VIDEOS_STORAGE_KEY = "saban_lobby_videos_custom_v2";

export const DEFAULT_VIDEO_SETTINGS: VideoLibrarySettings = {
  enableVideoInterludes: true,
  videoIntervalSlides: 3, // For every 3 consecutive product slides, trigger commercial
  videoAudioMuted: true, // Audio muted for reliable browser autoplay on commercial displays
  autoSkipWhenEnded: true,
  aspectMode: "cover",
  adDurationSeconds: 12, // 10 to 15 seconds interstitial commercial
  googleDriveFolderId: GOOGLE_DRIVE_FOLDER_ID,
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

export function saveStoredVideoSettings(
  settings: Partial<VideoLibrarySettings>,
): VideoLibrarySettings {
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

/**
 * Preload video element in memory for stutter-free playback transition
 */
export function preloadVideo(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    const video = document.createElement("video");
    video.preload = "auto";
    video.src = src;
    video.onloadeddata = () => resolve(true);
    video.onerror = () => resolve(false);
    // Timeout after 4 seconds to never block rotation
    setTimeout(() => resolve(false), 4000);
  });
}
