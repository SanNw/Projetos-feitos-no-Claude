import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute as useNavigationRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useSelectedRoute } from "@/context/RouteContext";
import { AIRPORTS } from "@/data/airports";
import { colors } from "@/theme/colors";

export function RouteSelectorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useNavigationRoute<any>();
  const field: "origin" | "destination" = params?.field ?? "origin";
  const { route, setRoute } = useSelectedRoute();

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AIRPORTS;
    return AIRPORTS.filter(
      (a) =>
        a.city.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    );
  }, [query]);

  const select = (code: string) => {
    setRoute({ ...route, [field]: code });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar cidade, aeroporto ou código"
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoFocus
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => {
          const isSelected = route[field] === item.code;
          return (
            <TouchableOpacity style={[styles.row, isSelected && styles.rowSelected]} onPress={() => select(item.code)}>
              <View>
                <Text style={styles.city}>
                  {item.city} {item.international ? `· ${item.country}` : ""}
                </Text>
                <Text style={styles.name}>
                  {item.name} ({item.code})
                </Text>
              </View>
              {isSelected && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMuted },
  search: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowSelected: { backgroundColor: colors.cheapBg },
  city: { fontWeight: "700", color: colors.textPrimary },
  name: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  check: { color: colors.cheap, fontWeight: "800", fontSize: 16 },
});
