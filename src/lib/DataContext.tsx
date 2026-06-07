import React, { createContext, useContext, useEffect, useState } from 'react';
import { PlatformData, HomeData, TravelData, BookmarkData } from '../types';

interface DataContextType {
  data: PlatformData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateHomeConfig: (homeData: Partial<HomeData>) => Promise<boolean>;
  addTravel: (travel: Omit<TravelData, 'id'>) => Promise<boolean>;
  deleteTravel: (id: string) => Promise<boolean>;
  updateTravel?: (id: string, travel: Partial<TravelData>) => Promise<boolean>; // optional to implement later if needed
  addBookmark: (bookmark: Omit<BookmarkData, 'id'>) => Promise<boolean>;
  deleteBookmark: (id: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType>({
  data: null,
  loading: true,
  refresh: async () => {},
  updateHomeConfig: async () => false,
  addTravel: async () => false,
  deleteTravel: async () => false,
  addBookmark: async () => false,
  deleteBookmark: async () => false,
});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PlatformData | null>(() => {
    // Read from localStorage initially
    const cached = localStorage.getItem('platform_data');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const getValidToken = () => {
    const decodeToken = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    };

    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      const payload = decodeToken(adminToken);
      if (payload && payload.exp * 1000 > Date.now()) return adminToken;
      localStorage.removeItem('admin_token');
    }
    
    const travelToken = localStorage.getItem('travel_token');
    if (travelToken) {
      const payload = decodeToken(travelToken);
      if (payload && payload.exp * 1000 > Date.now()) return travelToken;
      localStorage.removeItem('travel_token');
    }
    
    return null;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getValidToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/data', { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        localStorage.setItem('platform_data', JSON.stringify(json));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getHeaders = () => {
    const token = getValidToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const updateHomeConfig = async (homeUpdate: Partial<HomeData>) => {
    try {
      const res = await fetch('/api/data/home', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(homeUpdate)
      });
      if (res.ok) {
        const { home } = await res.json();
        setData(prev => {
          const newData = prev ? { ...prev, home } : null;
          if (newData) localStorage.setItem('platform_data', JSON.stringify(newData));
          return newData;
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const addTravel = async (travel: Omit<TravelData, 'id'>) => {
    try {
      const res = await fetch('/api/data/travels', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(travel)
      });
      if (res.ok) {
        const newTravel = await res.json();
        setData(prev => {
          const newData = prev ? { ...prev, travels: [...prev.travels, newTravel] } : null;
          if (newData) localStorage.setItem('platform_data', JSON.stringify(newData));
          return newData;
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const deleteTravel = async (id: string) => {
    try {
      const res = await fetch(`/api/data/travels/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setData(prev => {
          const newData = prev ? { ...prev, travels: prev.travels.filter(t => t.id !== id) } : null;
          if (newData) localStorage.setItem('platform_data', JSON.stringify(newData));
          return newData;
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const addBookmark = async (bookmark: Omit<BookmarkData, 'id'>) => {
    try {
      const res = await fetch('/api/data/bookmarks', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bookmark)
      });
      if (res.ok) {
        const newBookmark = await res.json();
        setData(prev => {
          const newData = prev ? { ...prev, bookmarks: [...prev.bookmarks, newBookmark] } : null;
          if (newData) localStorage.setItem('platform_data', JSON.stringify(newData));
          return newData;
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const deleteBookmark = async (id: string) => {
    try {
      const res = await fetch(`/api/data/bookmarks/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setData(prev => {
          const newData = prev ? { ...prev, bookmarks: prev.bookmarks.filter(b => b.id !== id) } : null;
          if (newData) localStorage.setItem('platform_data', JSON.stringify(newData));
          return newData;
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const updateTravel = async (id: string, travelUpdate: Partial<TravelData>) => {
    try {
      const res = await fetch(`/api/data/travels/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(travelUpdate)
      });
      if (res.ok) {
        const updatedTravel = await res.json();
        setData(prev => {
          const newData = prev ? { ...prev, travels: prev.travels.map(t => t.id === id ? updatedTravel : t) } : null;
          if (newData) localStorage.setItem('platform_data', JSON.stringify(newData));
          return newData;
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  return (
    <DataContext.Provider value={{ data, loading, refresh: fetchData, updateHomeConfig, addTravel, updateTravel, deleteTravel, addBookmark, deleteBookmark }}>
      {children}
    </DataContext.Provider>
  );
}
