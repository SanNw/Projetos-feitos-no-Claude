import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import type { PriceHistoryPoint } from "@/types";
import { colors } from "@/theme/colors";
import { formatBRL } from "@/utils/currency";
import { formatDayMonth } from "@/utils/date";

const CHART_HEIGHT = 160;
const PADDING_Y = 20;
const PADDING_X = 8;

interface Coord extends PriceHistoryPoint {
  x: number;
  y: number;
}

function buildPath(coords: Coord[]): string {
  return coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
}

/**
 * Linha única de tendência (menor preço encontrado por dia de consulta).
 * Sem legenda de propósito — série única, o título já diz o que é (ver
 * skill dataviz: "a single series needs no legend box"). Arraste o dedo
 * sobre o gráfico para ver data e preço de um ponto específico.
 */
export function PriceHistoryChart({ points }: { points: PriceHistoryPoint[] }) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const prices = points.map((p) => p.price);
  const min = points.length > 0 ? Math.min(...prices) : 0;
  const max = points.length > 0 ? Math.max(...prices) : 0;
  const range = max - min || 1;

  const coords = useMemo<Coord[]>(() => {
    if (width === 0 || points.length === 0) return [];
    const usableWidth = width - PADDING_X * 2;
    return points.map((p, i) => ({
      ...p,
      x: PADDING_X + (points.length === 1 ? usableWidth / 2 : (i / (points.length - 1)) * usableWidth),
      y: PADDING_Y + (1 - (p.price - min) / range) * (CHART_HEIGHT - PADDING_Y * 2),
    }));
  }, [points, width, min, range]);

  const updateActiveFromX = (x: number) => {
    if (coords.length === 0) return;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setActiveIndex(nearest);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => updateActiveFromX(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => updateActiveFromX(evt.nativeEvent.locationX),
        onPanResponderRelease: () => setActiveIndex(null),
        onPanResponderTerminate: () => setActiveIndex(null),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coords]
  );

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (points.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Ainda não há histórico suficiente para esta rota. O app registra o menor preço encontrado a cada vez
          que você abre esta tela — volte em alguns dias para ver a tendência.
        </Text>
      </View>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const trendUp = last.price > first.price;
  const active = activeIndex !== null ? points[activeIndex] : null;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Histórico de preços: variou entre ${formatBRL(min)} e ${formatBRL(max)} no período. Preço mais recente: ${formatBRL(last.price)}.`}
    >
      <View onLayout={onLayout} style={{ height: CHART_HEIGHT }} {...panResponder.panHandlers}>
        {width > 0 && coords.length > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {[min, (min + max) / 2, max].map((value, i) => {
              const y = PADDING_Y + (1 - (value - min) / range) * (CHART_HEIGHT - PADDING_Y * 2);
              return (
                <Line key={i} x1={PADDING_X} x2={width - PADDING_X} y1={y} y2={y} stroke={colors.border} strokeWidth={1} />
              );
            })}

            <Path d={buildPath(coords)} stroke={colors.brand} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

            <Circle
              cx={coords[coords.length - 1].x}
              cy={coords[coords.length - 1].y}
              r={5}
              fill={colors.brand}
              stroke={colors.surface}
              strokeWidth={2}
            />

            {activeIndex !== null && (
              <>
                <Line
                  x1={coords[activeIndex].x}
                  x2={coords[activeIndex].x}
                  y1={PADDING_Y}
                  y2={CHART_HEIGHT - PADDING_Y}
                  stroke={colors.textSecondary}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                <Circle
                  cx={coords[activeIndex].x}
                  cy={coords[activeIndex].y}
                  r={5}
                  fill={colors.brand}
                  stroke={colors.surface}
                  strokeWidth={2}
                />
              </>
            )}
          </Svg>
        )}

        {active && width > 0 && (
          <View pointerEvents="none" style={[styles.tooltip, { left: Math.max(4, Math.min(width - 84, coords[activeIndex!].x - 40)) }]}>
            <Text style={styles.tooltipDate}>{formatDayMonth(active.date)}</Text>
            <Text style={styles.tooltipPrice}>{formatBRL(active.price)}</Text>
          </View>
        )}
      </View>

      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>{formatDayMonth(first.date)}</Text>
        <Text style={styles.axisLabel}>{formatDayMonth(last.date)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Mín. {formatBRL(min)}</Text>
        <Text style={[styles.currentPrice, { color: trendUp ? colors.expensive : colors.cheap }]}>
          {trendUp ? "▲" : "▼"} {formatBRL(last.price)}
        </Text>
        <Text style={styles.summaryText}>Máx. {formatBRL(max)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center" },
  axisRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  axisLabel: { fontSize: 11, color: colors.textSecondary, textTransform: "capitalize" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  summaryText: { fontSize: 12, color: colors.textSecondary },
  currentPrice: { fontSize: 15, fontWeight: "800" },
  tooltip: {
    position: "absolute",
    top: 0,
    width: 80,
    backgroundColor: colors.textPrimary,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  tooltipDate: { color: "#fff", fontSize: 10, textTransform: "capitalize" },
  tooltipPrice: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
