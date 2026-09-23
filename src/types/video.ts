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
}

export interface VideoLibrarySettings {
  enableVideoInterludes: boolean;
  videoIntervalSlides: number; // Every X product slides (default: 2)
  videoAudioMuted: boolean;
  autoSkipWhenEnded: boolean;
  aspectMode: "contain" | "cover";
}
