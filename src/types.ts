export interface HomeData {
  title: string;
  description: string;
  welcomeMessage: string;
  avatarUrl?: string;
}

export interface TravelData {
  id: string;
  location: string;
  date: string;
  imageUrl: string;
  description?: string;
}

export interface BookmarkData {
  id: string;
  title: string;
  url: string;
  description: string;
  category?: string;
}

export interface PlatformData {
  home: HomeData;
  travels: TravelData[];
  bookmarks: BookmarkData[];
  settings?: {
    passwordHash: string;
  };
}
