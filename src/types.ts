export interface CustomBlock {
  id: string;
  type: 'text' | 'image';
  title?: string;
  content?: string;
  url?: string;
}

export interface HomeData {
  title: string;
  description: string;
  welcomeMessage: string;
  avatarUrl?: string;
  customBlocks?: CustomBlock[];
}

export interface TravelData {
  id: string;
  location: string;
  title: string;
  date: string;
  imageUrl?: string;
  imageUrls?: string[];
  coverImageIndex?: number;
  description?: string;
  tags?: string[];
  bookmarked?: boolean;
}

export interface BookmarkData {
  id: string;
  title: string;
  url: string;
  description: string;
  category?: string;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  dayOfWeek?: number;
  time: string;
  retentionCount: number;
}

export interface PlatformData {
  home: HomeData;
  travels: TravelData[];
  isTravelAuthorized?: boolean;
  bookmarks: BookmarkData[];
  settings?: {
    passwordHash: string;
  };
  backupSettings?: BackupSettings;
}
