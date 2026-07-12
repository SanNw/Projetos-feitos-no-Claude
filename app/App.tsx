import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { RouteProvider } from "@/context/RouteContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { RootNavigator } from "@/navigation";
import { registerForPushNotificationsAsync } from "@/notifications/registerForPushNotifications";

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <RouteProvider>
        <FavoritesProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </FavoritesProvider>
      </RouteProvider>
    </SafeAreaProvider>
  );
}
