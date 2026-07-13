import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, radius, space, type Palette } from "@/theme/colors";
import { usePalette } from "@/theme/usePalette";

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      marginHorizontal: space[4],
      marginTop: space[6],
      padding: space[4],
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: palette.destructive,
      borderRadius: radius,
      gap: space[2],
    },
    title: {
      fontFamily: fonts.bodyBold,
      fontSize: 18,
      color: palette.destructive,
      textAlign: "center",
    },
    text: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.fgMuted,
      textAlign: "center",
      lineHeight: 19,
    },
    button: {
      minHeight: 44,
      paddingHorizontal: space[4],
      justifyContent: "center",
      borderRadius: radius - 2,
      backgroundColor: palette.accent,
      marginTop: space[1],
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      fontFamily: fonts.bodyBold,
      fontSize: 14,
      color: palette.accentFg,
    },
  });
}

interface Props {
  onRetry: () => void;
}

export const ErrorState = memo(function ErrorState({ onRetry }: Props) {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.title}>Não foi possível buscar agora</Text>
      <Text style={styles.text}>
        As três fontes de livros falharam (rede instável ou fora do ar). Verifique sua conexão e
        tente de novo.
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Tentar buscar novamente"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
});
