import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Route } from "@/types";
import { DEFAULT_DESTINATION, DEFAULT_ORIGIN } from "@/data/airports";

const STORAGE_KEY = "@monitor-passagens/selected-route";

interface RouteContextValue {
  route: Route;
  setRoute: (route: Route) => void;
  resetToDefault: () => void;
}

const RouteContext = createContext<RouteContextValue | undefined>(undefined);

export function RouteProvider({ children }: { children: React.ReactNode }) {
  const [route, setRouteState] = useState<Route>({ origin: DEFAULT_ORIGIN, destination: DEFAULT_DESTINATION });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Route;
        if (parsed.origin && parsed.destination) setRouteState(parsed);
      } catch {
        // ignora storage corrompido e mantém a rota padrão
      }
    });
  }, []);

  const setRoute = (newRoute: Route) => {
    setRouteState(newRoute);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRoute));
  };

  const resetToDefault = () => setRoute({ origin: DEFAULT_ORIGIN, destination: DEFAULT_DESTINATION });

  const value = useMemo(() => ({ route, setRoute, resetToDefault }), [route]);

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

// Nome diferente de "useRoute" de propósito: @react-navigation/native já exporta um
// hook com esse nome (para ler os params da tela atual), e os dois seriam confundidos.
export function useSelectedRoute(): RouteContextValue {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useSelectedRoute deve ser usado dentro de RouteProvider");
  return ctx;
}
