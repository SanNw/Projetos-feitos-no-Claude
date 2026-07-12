import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FavoriteRoute } from "@/types";
import * as api from "@/api/client";
import { usePremium } from "./PremiumContext";
import { FREE_FAVORITES_LIMIT } from "@/billing/constants";

const STORAGE_KEY = "@monitor-passagens/favorites";

export type AddFavoriteResult = { ok: true } | { ok: false; reason: "limit_reached" };

interface FavoritesContextValue {
  favorites: FavoriteRoute[];
  loading: boolean;
  isFavorite: (origin: string, destination: string) => boolean;
  addFavorite: (origin: string, destination: string) => Promise<AddFavoriteResult>;
  removeFavorite: (id: string) => Promise<void>;
  setAlertThreshold: (id: string, threshold: number | null) => Promise<void>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isPremium } = usePremium();
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const persistLocally = (items: FavoriteRoute[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const refresh = useCallback(async () => {
    try {
      const remote = await api.fetchFavorites();
      setFavorites(remote);
      persistLocally(remote);
    } catch {
      // Servidor indisponível: mantém o que já está salvo localmente.
    }
  }, []);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          setFavorites(JSON.parse(raw));
        } catch {
          // ignora storage corrompido
        }
      }
      setLoading(false);
      refresh();
    })();
  }, [refresh]);

  const isFavorite = (origin: string, destination: string) =>
    favorites.some((f) => f.origin === origin && f.destination === destination);

  const addFavorite = async (origin: string, destination: string): Promise<AddFavoriteResult> => {
    if (!isPremium && favorites.length >= FREE_FAVORITES_LIMIT) {
      return { ok: false, reason: "limit_reached" };
    }

    try {
      const created = await api.createFavorite(origin, destination, null);
      setFavorites((prev) => {
        const next = [created, ...prev];
        persistLocally(next);
        return next;
      });
    } catch {
      const fallback: FavoriteRoute = {
        id: `local-${Date.now()}`,
        origin,
        destination,
        alertThreshold: null,
        createdAt: new Date().toISOString(),
      };
      setFavorites((prev) => {
        const next = [fallback, ...prev];
        persistLocally(next);
        return next;
      });
    }
    return { ok: true };
  };

  const removeFavorite = async (id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      persistLocally(next);
      return next;
    });
    try {
      await api.deleteFavorite(id);
    } catch {
      // já removido localmente; será reconciliado no próximo refresh bem-sucedido
    }
  };

  const setAlertThreshold = async (id: string, threshold: number | null) => {
    setFavorites((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, alertThreshold: threshold } : f));
      persistLocally(next);
      return next;
    });
    try {
      await api.updateFavoriteAlert(id, threshold);
    } catch {
      // será reconciliado no próximo refresh bem-sucedido
    }
  };

  const value = useMemo(
    () => ({ favorites, loading, isFavorite, addFavorite, removeFavorite, setAlertThreshold, refresh }),
    [favorites, loading, isPremium]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
