import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRoute as useNavigationRoute } from "@react-navigation/native";
import { useSelectedRoute } from "@/context/RouteContext";
import { fetchCompareOrigins, fetchDay } from "@/api/client";
import { AIRPORTS, airportLabel, findAirport } from "@/data/airports";
import { colors, tagMeta } from "@/theme/colors";
import { formatBRL } from "@/utils/currency";
import { formatFullDate } from "@/utils/date";
import type { CalendarDay, FlightPriceRecord } from "@/types";

export function DayDetailScreen() {
  const { params } = useNavigationRoute<any>();
  const date: string = params.date;
  const { route } = useSelectedRoute();

  const [day, setDay] = useState<CalendarDay | null>(null);
  const [comparison, setComparison] = useState<Record<string, FlightPriceRecord | null>>({});
  const [loading, setLoading] = useState(true);

  const originGroup = findAirport(route.origin)?.cityGroup;
  const siblingOrigins = AIRPORTS.filter((a) => a.cityGroup === originGroup).map((a) => a.code);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDay(route.origin, route.destination, date),
      siblingOrigins.length > 1 ? fetchCompareOrigins(siblingOrigins, route.destination, date) : Promise.resolve({}),
    ])
      .then(([days, cmp]) => {
        setDay(days.find((d) => d.date === date) ?? null);
        setComparison(cmp);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, route.origin, route.destination]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />;
  }

  if (!day) {
    return (
      <View style={styles.container}>
        <Text>Não foi possível carregar essa data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{formatFullDate(day.date)}</Text>
      <Text style={styles.price}>{formatBRL(day.price)}</Text>
      <Text style={[styles.tag, { color: tagMeta[day.tag].color }]}>
        {tagMeta[day.tag].icon} {tagMeta[day.tag].label}
      </Text>
      <Text style={styles.airline}>{day.airline}</Text>
      {day.currencyOriginal !== "BRL" && (
        <Text style={styles.originalPrice}>
          Tarifa original: {day.priceOriginal.toFixed(2)} {day.currencyOriginal}
        </Text>
      )}

      <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(day.link)}>
        <Text style={styles.linkButtonText}>Ver esse voo</Text>
      </TouchableOpacity>

      {siblingOrigins.length > 1 && (
        <View style={styles.compareSection}>
          <Text style={styles.compareTitle}>Comparar aeroportos de origem</Text>
          {siblingOrigins.map((code) => {
            const record = comparison[code];
            return (
              <View key={code} style={styles.compareRow}>
                <Text style={styles.compareLabel}>{airportLabel(code)}</Text>
                <Text style={styles.comparePrice}>{record ? formatBRL(record.price) : "—"}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMuted, padding: 20 },
  date: { fontSize: 15, color: colors.textSecondary, textTransform: "capitalize", marginBottom: 8 },
  price: { fontSize: 34, fontWeight: "800", color: colors.textPrimary },
  tag: { fontWeight: "700", marginTop: 6, fontSize: 14 },
  airline: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  originalPrice: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  linkButton: {
    marginTop: 20,
    backgroundColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  linkButtonText: { color: "#fff", fontWeight: "700" },
  compareSection: { marginTop: 28 },
  compareTitle: { fontWeight: "700", color: colors.textPrimary, marginBottom: 10, fontSize: 16 },
  compareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compareLabel: { color: colors.textPrimary },
  comparePrice: { fontWeight: "700", color: colors.textPrimary },
});
