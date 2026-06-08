import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { studentStories as fallbackStories } from '../data/studentStories';

const StoriesContext = createContext(null);

export const StoriesProvider = ({ children }) => {
  const [stories, setStories] = useState(fallbackStories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!API_ENDPOINTS?.LEADERBOARD?.STORIES) {
          if (mounted) setLoading(false);
          return;
        }
        const res = await fetch(API_ENDPOINTS.LEADERBOARD.STORIES);
        if (!res.ok) throw new Error('Failed to fetch stories');
        const data = await res.json();
        const fetched = data?.data?.stories || [];
        if (mounted && fetched.length > 0) setStories(fetched);
      } catch (err) {
        // keep fallback
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <StoriesContext.Provider value={{ stories, loading }}>
      {children}
    </StoriesContext.Provider>
  );
};

export const useStories = () => {
  const ctx = useContext(StoriesContext);
  if (!ctx) throw new Error('useStories must be used inside StoriesProvider');
  return ctx;
};
