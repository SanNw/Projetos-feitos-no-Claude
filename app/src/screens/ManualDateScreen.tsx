import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useSelectedRoute } from "@/context/RouteContext";
import { fetchDay } from "@/api/client";
import { colors, tagMeta } from "@/theme/colors";
import { formatBRL } from "@/utils/currency";
import { formatDayMonth, formatWeekdayShort, MONTHS_PT, toDateKey } from "@/utils/date";
import type { CalendarDay } from "@/types";

const now = new Date();
const YEARS = [now.getFullYear(), now.getFullYear() + 1];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function ManualDateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { route } = useSelectedRoute();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [day, setDay] = useState(now.getDate());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalendarDay[]>([]);

  const maxDay = daysInMonth(year, month);
  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [maxDay, day]);

  const dateKey = useMemo(() => {
    const d = new Date(Date.UTC(year, month, Math.min(day, maxDay)));
    return toDateKey(d);
  }, [year, month, day, maxDay]);

  useEffect(() => {
    setLoading(true);
    fetchDay(route.origin, route.destination, dateKey)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [dateKey, route.origin, route.destination]);

  const selected = result.find((r) => r.date === dateKey);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolha a data</Text>

      <PickerRow label="Ano" items={YEARS.map(String)} selectedIndex={YEARS.indexOf(year)} onSelect={(i) => setYear(YEARS[i])} />
      <PickerRow label="Mês" items={MONTHS_PT} selectedIndex={month} onSelect={setMonth} />
      <PickerRow
        label="Dia"
        items={Array.from({ length: maxDay }, (_, i) => String(i + 1))}
        selectedIndex={day - 1}
        onSelect={(i) => setDay(i + 1)}
      />

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.resultSection}>
          {selected && (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedDate}>
                {formatDayMonth(selected.date)} ({formatWeekdayShort(selected.date)})
              </Text>
              <Text style={styles.selectedPrice}>{formatBRL(selected.price)}</Text>
              <Text style={styles.selectedAirline}>{selected.airline}</Text>
              <Text style={[styles.selectedTag, { color: tagMeta[selected.tag].color }]}>
                {tagMeta[selected.tag].icon} {tagMeta[selected.tag].label}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.detailButton, pressed && styles.pressed]}
                onPress={() => navigation.navigate("DayDetail", { date: selected.date })}
              >
                <Text style={styles.detailButtonText}>Ver detalhes e datas próximas</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.compareTitle}>Datas próximas (±3 dias)</Text>
          {result
            .filter((r) => r.date !== dateKey)
            .map((r) => (
              <View key={r.date} style={styles.compareRow}>
                <Text style={styles.compareDate}>{formatDayMonth(r.date)}</Text>
                <Text style={[styles.compareTag, { color: tagMeta[r.tag].color }]}>{tagMeta[r.tag].icon}</Text>
                <Text style={styles.comparePrice}>{formatBRL(r.price)}</Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

function PickerRow({
  label,
  items,
  selectedIndex,
  onSelect,
}: {
  label: string;
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.pickerRow}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item, i) => `${item}-${i}`}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [
              styles.pickerChip,
              index === selectedIndex && styles.pickerChipActive,
              pressed && styles.pickerChipPressed,
            ]}
            onPress={() => onSelect(index)}
          >
            <Text
              style={[styles.pickerChipText, index === selectedIndex && styles.pickerChipTextActive]}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMuted, padding: 16 },
  title: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, marginBottom: 16 },
  pickerRow: { marginBottom: 16 },
  pickerLabel: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 },
  pickerChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pickerChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  pickerChipPressed: { opacity: 0.6 },
  pickerChipText: { color: colors.textPrimary, textTransform: "capitalize" },
  pickerChipTextActive: { color: "#fff", fontWeight: "700" },
  resultSection: { marginTop: 12 },
  selectedCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  selectedDate: { fontSize: 14, color: colors.textSecondary, textTransform: "capitalize", marginBottom: 4 },
  selectedPrice: { fontSize: 28, fontWeight: "800", color: colors.textPrimary },
  selectedAirline: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  selectedTag: { fontWeight: "700", marginTop: 8 },
  detailButton: { marginTop: 12, alignSelf: "flex-start" },
  pressed: { opacity: 0.6 },
  detailButtonText: { color: colors.brand, fontWeight: "700" },
  compareTitle: { fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
  compareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compareDate: { color: colors.textPrimary, textTransform: "capitalize", flex: 1 },
  compareTag: { fontWeight: "700", marginHorizontal: 8 },
  comparePrice: { fontWeight: "700", color: colors.textPrimary },
});
