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
  externalLink?: string;
  externalLinkText?: string;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  order?: number;
}

export interface BookmarkData {
  id: string;
  title: string;
  url: string;
  description?: string;
  category?: string; // legacy category string
  categoryId?: string; // reference to custom category
  order?: number;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  daysOfWeek?: number[];
  time: string;
  retentionCount: number;
}

export interface EpochCategory {
  id: string;
  name: string;
  color: string;
}

export interface EpochEvent {
  id: string;
  date: string;
  title: string;
  desc?: string;
  categoryId: string;
}

export interface PlatformData {
  home: HomeData;
  travels: TravelData[];
  isTravelAuthorized?: boolean;
  bookmarkCategories?: BookmarkCategory[];
  bookmarks: BookmarkData[];
  epochCategories: EpochCategory[];
  epochEvents: EpochEvent[];
  settings?: {
    passwordHash: string;
  };
  backupSettings?: BackupSettings;
}
