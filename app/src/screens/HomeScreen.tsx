import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useSelectedRoute } from "@/context/RouteContext";
import { useFavorites } from "@/context/FavoritesContext";
import { fetchBestDays, fetchCalendar, fetchHistory } from "@/api/client";
import { airportLabel } from "@/data/airports";
import { colors } from "@/theme/colors";
import { PriceCalendar } from "@/components/PriceCalendar";
import { BestDaysList } from "@/components/BestDaysList";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import type { CalendarDay, PriceHistoryPoint } from "@/types";

const DAYS_AHEAD = 90;

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { route } = useSelectedRoute();
  const { isFavorite, addFavorite, removeFavorite, favorites } = useFavorites();

  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [bestDays, setBestDays] = useState<CalendarDay[]>([]);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [calendarData, bestData, historyData] = await Promise.all([
      fetchCalendar(route.origin, route.destination, DAYS_AHEAD),
      fetchBestDays(route.origin, route.destination, DAYS_AHEAD, 8),
      fetchHistory(route.origin, route.destination, DAYS_AHEAD),
    ]);
    setCalendar(calendarData);
    setBestDays(bestData);
    setHistory(historyData);
  }, [route.origin, route.destination]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const favorite = favorites.find((f) => f.origin === route.origin && f.destination === route.destination);

  const toggleFavorite = () => {
    if (favorite) {
      removeFavorite(favorite.id);
    } else {
      addFavorite(route.origin, route.destination);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.routeRow}>
          <Pressable
            style={({ pressed }) => [styles.airportButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate("RouteSelector", { field: "origin" })}
          >
            <Text style={styles.airportLabel}>{airportLabel(route.origin)}</Text>
          </Pressable>
          <Text style={styles.arrow}>⇄</Text>
          <Pressable
            style={({ pressed }) => [styles.airportButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate("RouteSelector", { field: "destination" })}
          >
            <Text style={styles.airportLabel}>{airportLabel(route.destination)}</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate("ManualDate")}
          >
            <Text style={styles.secondaryButtonText}>Escolher data manualmente</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.starButton, pressed && styles.pressed]} onPress={toggleFavorite}>
            <Text style={styles.starText}>{favorite ? "★" : "☆"}</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.brand} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Melhores dias para viajar</Text>
          <PriceCalendar days={calendar} onSelectDay={(date) => navigation.navigate("DayDetail", { date })} />

          <Text style={styles.sectionTitle}>Top dias mais baratos</Text>
          <BestDaysList days={bestDays} onSelectDay={(date) => navigation.navigate("DayDetail", { date })} />

          <Text style={styles.sectionTitle}>Histórico de preços</Text>
          <PriceHistoryChart points={history} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMuted },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  routeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 },
  airportButton: {
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  airportLabel: { fontWeight: "700", color: colors.textPrimary },
  arrow: { fontSize: 18, color: colors.textSecondary },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  secondaryButton: {
    backgroundColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  starButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  starText: { fontSize: 20, color: "#D97706" },
  pressed: { opacity: 0.6 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  loader: { marginTop: 40 },
});
