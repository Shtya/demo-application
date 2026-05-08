import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const FavIconContext = createContext(null);

export const FavIconProvider = ({ children }) => {
  const favIconPos = useRef({ x: 0, y: 0 });
  const cartTabPos = useRef({ x: 0, y: 0 });
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = useCallback((item, liked) => {
    setFavorites((prev) => {
      if (liked) {
        if (prev.some((fav) => fav.id === item.id)) return prev;
        return [...prev, item];
      }
      return prev.filter((fav) => fav.id !== item.id);
    });
  }, []);

  const favoriteCount = favorites.length;

  return (
    <FavIconContext.Provider value={{ favIconPos, cartTabPos, favorites, favoriteCount, toggleFavorite }}>
      {children}
    </FavIconContext.Provider>
  );
};

export const useFavIcon = () => useContext(FavIconContext);
