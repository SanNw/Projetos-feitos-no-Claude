import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PriceTag } from "@/types";
import { tagMeta } from "@/theme/colors";

export function PriceBadge({ tag }: { tag: PriceTag }) {
  const meta = tagMeta[tag];
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.icon, { color: meta.color }]}>{meta.icon}</Text>
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
    alignSelf: "flex-start",
  },
  icon: { fontSize: 10, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600" },
});
