import React, { useMemo } from "react";
import { StyleSheet, Text, Pressable, View } from "react-native";
import type { CalendarDay } from "@/types";
import { colors, tagMeta } from "@/theme/colors";
import { monthLabel, parseDateKey } from "@/utils/date";

export interface MonthGroup {
  key: string;
  label: string;
  leadingBlanks: number;
  days: CalendarDay[];
}

export function groupByMonth(days: CalendarDay[]): MonthGroup[] {
  const groups = new Map<string, CalendarDay[]>();
  for (const day of days) {
    const d = parseDateKey(day.date);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(day);
  }
  return Array.from(groups.entries()).map(([key, monthDays]) => {
    const [year, month] = key.split("-").map(Number);
    const firstWeekday = parseDateKey(monthDays[0].date).getUTCDay();
    return {
      key,
      label: monthLabel(year, month),
      leadingBlanks: firstWeekday,
      days: monthDays,
    };
  });
}

const WEEKDAY_HEADER = ["D", "S", "T", "Q", "Q", "S", "S"];

export function PriceCalendar({
  days,
  onSelectDay,
}: {
  days: CalendarDay[];
  onSelectDay: (date: string) => void;
}) {
  const months = useMemo(() => groupByMonth(days), [days]);

  return (
    <View>
      {months.map((month) => (
        <View key={month.key} style={styles.monthBlock}>
          <Text style={styles.monthTitle}>{month.label}</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAY_HEADER.map((w, i) => (
              <Text key={i} style={styles.weekdayLabel}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {Array.from({ length: month.leadingBlanks }).map((_, i) => (
              <View key={`blank-${i}`} style={styles.cell} />
            ))}
            {month.days.map((day) => {
              const meta = tagMeta[day.tag];
              const dayNumber = parseDateKey(day.date).getUTCDate();
              return (
                <Pressable
                  key={day.date}
                  style={({ pressed }) => [
                    styles.cell,
                    styles.dayCell,
                    tagCellStyles[day.tag],
                    pressed && styles.dayCellPressed,
                  ]}
                  onPress={() => onSelectDay(day.date)}
                  accessibilityLabel={`${dayNumber}, ${meta.label}, ${day.price}`}
                >
                  <Text style={[styles.dayNumber, tagTextStyles[day.tag]]}>{dayNumber}</Text>
                  <Text style={[styles.dayIcon, tagTextStyles[day.tag]]}>{meta.icon}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.legend}>
        {(Object.keys(tagMeta) as Array<keyof typeof tagMeta>).map((tag) => {
          const meta = tagMeta[tag];
          return (
            <View key={tag} style={styles.legendItem}>
              <Text style={[styles.legendIcon, tagTextStyles[tag]]}>{meta.icon}</Text>
              <Text style={styles.legendLabel}>{meta.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

// Hoisted no escopo do módulo (referências estáveis) em vez de montar
// `{ backgroundColor: meta.bg }` a cada iteração do .map() — ver skill
// vercel-react-native-skills, regra list-performance-inline-objects.
const tagCellStyles = StyleSheet.create({
  cheap: { backgroundColor: tagMeta.cheap.bg },
  medium: { backgroundColor: tagMeta.medium.bg },
  expensive: { backgroundColor: tagMeta.expensive.bg },
});
const tagTextStyles = StyleSheet.create({
  cheap: { color: tagMeta.cheap.color },
  medium: { color: tagMeta.medium.color },
  expensive: { color: tagMeta.expensive.color },
});

const styles = StyleSheet.create({
  monthBlock: { marginBottom: 20 },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
    textTransform: "capitalize",
  },
  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: CELL_SIZE, aspectRatio: 1, padding: 2 },
  dayCell: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellPressed: { opacity: 0.6 },
  dayNumber: { fontSize: 13, fontWeight: "700" },
  dayIcon: { fontSize: 9 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendIcon: { fontSize: 11, fontWeight: "700" },
  legendLabel: { fontSize: 12, color: colors.textSecondary },
});
