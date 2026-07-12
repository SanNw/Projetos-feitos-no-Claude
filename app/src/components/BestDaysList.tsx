import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { CalendarDay } from "@/types";
import { colors } from "@/theme/colors";
import { formatBRL } from "@/utils/currency";
import { formatFullDate } from "@/utils/date";
import { PriceBadge } from "./PriceBadge";

export function BestDaysList({
  days,
  onSelectDay,
}: {
  days: CalendarDay[];
  onSelectDay: (date: string) => void;
}) {
  return (
    <View style={styles.container}>
      {days.map((day, index) => (
        <TouchableOpacity key={day.date} style={styles.row} onPress={() => onSelectDay(day.date)}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>{index + 1}º</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.date}>{formatFullDate(day.date)}</Text>
            <Text style={styles.airline}>{day.airline}</Text>
            <PriceBadge tag={day.tag} />
          </View>
          <Text style={styles.price}>{formatBRL(day.price)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontWeight: "700", color: colors.textPrimary, fontSize: 12 },
  info: { flex: 1, gap: 4 },
  date: { fontWeight: "700", color: colors.textPrimary, textTransform: "capitalize" },
  airline: { color: colors.textSecondary, fontSize: 12 },
  price: { fontWeight: "800", fontSize: 16, color: colors.textPrimary },
});
