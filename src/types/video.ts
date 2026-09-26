export interface LobbyVideoItem {
  id: string;
  title: string;
  subtitle: string;
  category: "תדמית ומיתוג" | "אפליקציה ודיגיטל" | "גבס ובידוד" | "שירות ודלפק" | "מותאם אישית";
  videoSrc: string;
  posterSrc: string;
  durationSec: number;
  branch: string;
  enabled: boolean;
  isCustomUpload?: boolean;
  addedAt?: string;
  driveFileId?: string;
  sourceType?: "local" | "drive";
  fallbackSrc?: string;
}

export interface VideoLibrarySettings {
  enableVideoInterludes: boolean;
  videoIntervalSlides: number; // Every X product slides (default: 3)
  videoAudioMuted: boolean;
  autoSkipWhenEnded: boolean;
  aspectMode: "contain" | "cover";
  adDurationSeconds: number; // 10 to 15 seconds
  googleDriveFolderId: string;
}
