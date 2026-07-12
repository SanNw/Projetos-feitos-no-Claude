import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useSelectedRoute } from "@/context/RouteContext";
import { useFavorites } from "@/context/FavoritesContext";
import { usePremium } from "@/context/PremiumContext";
import { FREE_FAVORITES_LIMIT } from "@/billing/constants";
import { airportLabel } from "@/data/airports";
import { colors } from "@/theme/colors";
import { formatBRL } from "@/utils/currency";
import type { FavoriteRoute } from "@/types";

export function FavoritesScreen() {
  const { favorites, removeFavorite, setAlertThreshold } = useFavorites();
  const { setRoute } = useSelectedRoute();
  const { isPremium } = usePremium();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <PlanBanner isPremium={isPremium} favoritesCount={favorites.length} onUpgrade={() => navigation.navigate("Paywall")} />

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Você ainda não tem rotas favoritas. Toque na estrela na tela inicial para salvar uma rota e receber
            alertas de preço.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListHeaderComponent={
            <Text style={styles.pushHint}>
              Você recebe uma notificação push quando o preço cair abaixo do limite definido (é preciso permitir
              notificações para este app).
            </Text>
          }
          renderItem={({ item }) => (
            <FavoriteCard
              favorite={item}
              onOpen={() => setRoute({ origin: item.origin, destination: item.destination })}
              onRemove={() => removeFavorite(item.id)}
              onSetAlert={(threshold) => setAlertThreshold(item.id, threshold)}
            />
          )}
        />
      )}
    </View>
  );
}

function PlanBanner({
  isPremium,
  favoritesCount,
  onUpgrade,
}: {
  isPremium: boolean;
  favoritesCount: number;
  onUpgrade: () => void;
}) {
  if (isPremium) {
    return (
      <View style={styles.planBanner}>
        <Text style={styles.planBannerText}>✨ Plano Pro ativo — rotas e alertas ilimitados</Text>
      </View>
    );
  }
  return (
    <Pressable style={({ pressed }) => [styles.planBanner, styles.planBannerFree, pressed && styles.pressed]} onPress={onUpgrade}>
      <Text style={styles.planBannerText}>
        Plano grátis: {favoritesCount}/{FREE_FAVORITES_LIMIT} rotas com alerta usadas.
      </Text>
      <Text style={styles.planBannerLink}>Assinar Pro para rotas ilimitadas →</Text>
    </Pressable>
  );
}

function FavoriteCard({
  favorite,
  onOpen,
  onRemove,
  onSetAlert,
}: {
  favorite: FavoriteRoute;
  onOpen: () => void;
  onRemove: () => void;
  onSetAlert: (threshold: number | null) => void;
}) {
  const [draft, setDraft] = useState(favorite.alertThreshold ? String(favorite.alertThreshold) : "");

  const saveAlert = () => {
    const parsed = Number(draft.replace(",", "."));
    onSetAlert(draft.trim() === "" || Number.isNaN(parsed) ? null : parsed);
  };

  return (
    <View style={styles.card}>
      <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={onOpen}>
        <Text style={styles.route}>
          {airportLabel(favorite.origin)} ⇄ {airportLabel(favorite.destination)}
        </Text>
        {favorite.lowestPrice != null && (
          <Text style={styles.lowest}>A partir de {formatBRL(favorite.lowestPrice)}</Text>
        )}
      </Pressable>

      <View style={styles.alertRow}>
        <Text style={styles.alertLabel}>Avisar quando abaixo de (R$)</Text>
        <TextInput
          style={styles.alertInput}
          keyboardType="decimal-pad"
          placeholder="ex: 400"
          placeholderTextColor={colors.textSecondary}
          value={draft}
          onChangeText={setDraft}
          onEndEditing={saveAlert}
        />
      </View>

      <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={onRemove}>
        <Text style={styles.remove}>Remover dos favoritos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMuted },
  planBanner: {
    backgroundColor: colors.brand,
    padding: 14,
    gap: 2,
  },
  planBannerFree: { backgroundColor: colors.textPrimary },
  planBannerText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  planBannerLink: { color: "#fff", fontSize: 12, opacity: 0.85, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { textAlign: "center", color: colors.textSecondary, lineHeight: 20 },
  pushHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  route: { fontWeight: "800", fontSize: 15, color: colors.textPrimary },
  lowest: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
  alertRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  alertLabel: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  alertInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 100,
    textAlign: "right",
    color: colors.textPrimary,
  },
  remove: { color: colors.expensive, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.6 },
});
