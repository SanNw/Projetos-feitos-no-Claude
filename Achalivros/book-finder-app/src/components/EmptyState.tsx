import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { fonts, space, type Palette } from "@/theme/colors";
import { usePalette } from "@/theme/usePalette";

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingHorizontal: space[4],
      paddingTop: space[6],
      gap: space[2],
    },
    title: {
      fontFamily: fonts.bodyBold,
      fontSize: 20,
      color: palette.fg,
      textAlign: "center",
    },
    text: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: palette.fgMuted,
      textAlign: "center",
      lineHeight: 20,
    },
  });
}

interface Props {
  variant: "initial" | "no-results";
  query?: string;
}

export const EmptyState = memo(function EmptyState({ variant, query }: Props) {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={styles.container} accessibilityRole="text">
      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth={1.5}>
        <Path d="M2 5.5c2.5-1.3 5.2-1.3 8 0v13c-2.8-1.3-5.5-1.3-8 0v-13Z" />
        <Path d="M22 5.5c-2.5-1.3-5.2-1.3-8 0v13c2.8-1.3 5.5-1.3 8 0v-13Z" />
      </Svg>
      {variant === "initial" ? (
        <>
          <Text style={styles.title}>Comece uma busca</Text>
          <Text style={styles.text}>
            Digite um título, autor ou assunto acima para encontrar livros — com capa, edição e
            downloads gratuitos em PDF/EPUB quando disponíveis.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Nenhum livro encontrado</Text>
          <Text style={styles.text}>
            Não encontramos resultados para "{query}". Tente outro título, autor ou termo mais
            geral.
          </Text>
        </>
      )}
    </View>
  );
});
