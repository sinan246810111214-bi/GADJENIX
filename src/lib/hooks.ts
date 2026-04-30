import { useState, useEffect } from 'react';

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentlyViewed');
    if (stored) {
      setRecent(JSON.parse(stored));
    }
  }, []);

  const addRecent = (product: any) => {
    const stored = localStorage.getItem('recentlyViewed');
    let current = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists to move to front
    current = current.filter((p: any) => p.id !== product.id);
    
    // Add to front
    current.unshift(product);
    
    // Limit to 10
    current = current.slice(0, 10);
    
    localStorage.setItem('recentlyViewed', JSON.stringify(current));
    setRecent(current);
  };

  return { recent, addRecent };
}
