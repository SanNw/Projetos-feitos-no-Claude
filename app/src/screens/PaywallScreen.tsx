import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePremium } from "@/context/PremiumContext";
import { mockSetPremium } from "@/billing/mockProvider";
import { FREE_FAVORITES_LIMIT } from "@/billing/constants";
import { colors } from "@/theme/colors";
import type { PurchasePackage } from "@/billing";

const FREE_FEATURES = [
  `Até ${FREE_FAVORITES_LIMIT} rotas favoritas com alerta de preço`,
  "Calendário de melhores dias (90 dias)",
  "Histórico de preços da rota",
];

const PRO_FEATURES = ["Rotas favoritas e alertas ilimitados", "Tudo do plano gratuito, sem limites"];

export function PaywallScreen() {
  const navigation = useNavigation();
  const { isPremium, offerings, purchase, restore, refresh } = usePremium();
  const [selected, setSelected] = useState<PurchasePackage["identifier"]>("annual");
  const [busy, setBusy] = useState(false);

  const handlePurchase = async () => {
    setBusy(true);
    try {
      const success = await purchase(selected);
      if (success) {
        Alert.alert("Assinatura ativada", "Agora você tem alertas ilimitados. Obrigado!");
        navigation.goBack();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    try {
      const restored = await restore();
      Alert.alert(restored ? "Assinatura restaurada" : "Nada para restaurar", restored ? "Bem-vindo de volta ao Pro." : "Não encontramos uma assinatura ativa para restaurar.");
    } finally {
      setBusy(false);
    }
  };

  if (isPremium) {
    return (
      <View style={styles.centered}>
        <Text style={styles.proBadge}>✨ Você já é Pro</Text>
        <Text style={styles.proText}>Alertas e rotas favoritas ilimitados estão liberados.</Text>
        <Pressable style={({ pressed }) => [styles.dismissButton, pressed && styles.pressed]} onPress={() => navigation.goBack()}>
          <Text style={styles.dismissButtonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Monitor de Passagens Pro</Text>
      <Text style={styles.subtitle}>Desbloqueie alertas de preço ilimitados para todas as suas rotas favoritas.</Text>

      <View style={styles.compareRow}>
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Grátis</Text>
          {FREE_FEATURES.map((f) => (
            <Text key={f} style={styles.featureText}>
              · {f}
            </Text>
          ))}
        </View>
        <View style={[styles.planCard, styles.planCardHighlight]}>
          <Text style={[styles.planTitle, styles.planTitleHighlight]}>Pro</Text>
          {PRO_FEATURES.map((f) => (
            <Text key={f} style={[styles.featureText, styles.featureTextHighlight]}>
              · {f}
            </Text>
          ))}
        </View>
      </View>

      {offerings && (
        <View style={styles.pickerRow}>
          <Pressable
            style={({ pressed }) => [
              styles.pickerOption,
              selected === "monthly" && styles.pickerOptionActive,
              pressed && styles.pressed,
            ]}
            onPress={() => setSelected("monthly")}
          >
            <Text style={[styles.pickerLabel, selected === "monthly" && styles.pickerLabelActive]}>
              {offerings.monthly.title}
            </Text>
            <Text style={[styles.pickerPrice, selected === "monthly" && styles.pickerLabelActive]}>
              {offerings.monthly.priceLabel}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.pickerOption,
              selected === "annual" && styles.pickerOptionActive,
              pressed && styles.pressed,
            ]}
            onPress={() => setSelected("annual")}
          >
            <Text style={[styles.pickerLabel, selected === "annual" && styles.pickerLabelActive]}>
              {offerings.annual.title}
            </Text>
            <Text style={[styles.pickerPrice, selected === "annual" && styles.pickerLabelActive]}>
              {offerings.annual.priceLabel}
            </Text>
            {offerings.annual.savingsLabel && (
              <Text style={[styles.savingsLabel, selected === "annual" && styles.pickerLabelActive]}>
                {offerings.annual.savingsLabel}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.subscribeButton, pressed && styles.pressed]}
        onPress={handlePurchase}
        disabled={busy}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.subscribeButtonText}>Assinar</Text>}
      </Pressable>

      <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={handleRestore} disabled={busy}>
        <Text style={styles.restoreText}>Restaurar compras</Text>
      </Pressable>

      <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => navigation.goBack()}>
        <Text style={styles.laterText}>Continuar no plano gratuito</Text>
      </Pressable>

      <Text style={styles.demoNote}>
        Modo de demonstração: nenhuma cobrança real é feita — "Assinar" apenas simula a compra localmente.
      </Text>
    </ScrollView>
  );
}

export function DevPremiumReset() {
  const { refresh } = usePremium();
  return (
    <Pressable
      onPress={async () => {
        await mockSetPremium(false);
        await refresh();
      }}
    >
      <Text style={styles.restoreText}>[dev] desativar simulação de Pro</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceMuted },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  proBadge: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  proText: { color: colors.textSecondary, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, textAlign: "center" },
  subtitle: { color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
  compareRow: { flexDirection: "row", gap: 12 },
  planCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  planCardHighlight: { backgroundColor: colors.brand, borderColor: colors.brand },
  planTitle: { fontWeight: "800", fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  planTitleHighlight: { color: "#fff" },
  featureText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  featureTextHighlight: { color: "#EFF6FF" },
  pickerRow: { flexDirection: "row", gap: 12 },
  pickerOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 4,
  },
  pickerOptionActive: { borderColor: colors.brand, backgroundColor: colors.brand },
  pickerLabel: { fontWeight: "700", color: colors.textPrimary },
  pickerLabelActive: { color: "#fff" },
  pickerPrice: { fontWeight: "800", fontSize: 16, color: colors.textPrimary },
  savingsLabel: { fontSize: 10, color: colors.textSecondary, textAlign: "center" },
  subscribeButton: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  subscribeButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  restoreText: { color: colors.brand, textAlign: "center", fontWeight: "600" },
  laterText: { color: colors.textSecondary, textAlign: "center" },
  demoNote: { fontSize: 11, color: colors.textSecondary, textAlign: "center", marginTop: 8 },
  dismissButton: { backgroundColor: colors.brand, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  dismissButtonText: { color: "#fff", fontWeight: "700" },
  pressed: { opacity: 0.6 },
});
