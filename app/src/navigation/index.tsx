import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { RootStackParamList, TabParamList } from "./types";
import { HomeScreen } from "@/screens/HomeScreen";
import { FavoritesScreen } from "@/screens/FavoritesScreen";
import { RouteSelectorScreen } from "@/screens/RouteSelectorScreen";
import { ManualDateScreen } from "@/screens/ManualDateScreen";
import { DayDetailScreen } from "@/screens/DayDetailScreen";
import { PaywallScreen } from "@/screens/PaywallScreen";
import { colors } from "@/theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textPrimary },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Melhores dias",
          tabBarIcon: ({ color }) => <TabIcon symbol="📅" color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color }) => <TabIcon symbol="★" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ color, fontSize: 18 }}>{symbol}</Text>;
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textPrimary },
        headerTintColor: colors.brand,
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="RouteSelector" component={RouteSelectorScreen} options={{ title: "Selecionar aeroporto" }} />
      <Stack.Screen name="ManualDate" component={ManualDateScreen} options={{ title: "Data manual" }} />
      <Stack.Screen name="DayDetail" component={DayDetailScreen} options={{ title: "Detalhes do voo" }} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ title: "Monitor de Passagens Pro", presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
