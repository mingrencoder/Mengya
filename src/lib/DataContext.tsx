import React, { createContext, useContext, useEffect, useState } from 'react';
import { PlatformData } from '../types';

interface DataContextType {
  data: PlatformData | null;
  loading: boolean;
  refresh: () => void;
}

const DataContext = createContext<DataContextType>({
  data: null,
  loading: true,
  refresh: () => {}
});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        setData(json);
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

  return (
    <DataContext.Provider value={{ data, loading, refresh: fetchData }}>
      {children}
    </DataContext.Provider>
  );
}
