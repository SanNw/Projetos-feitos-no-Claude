import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, space, type Palette } from "@/theme/colors";
import { usePalette } from "@/theme/usePalette";

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: space[4],
      paddingTop: space[3],
      paddingBottom: space[2],
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 34,
      color: palette.primary,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.fgMuted,
      marginTop: space[1],
    },
  });
}

export const Header = memo(function Header() {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Achalivros
      </Text>
      <Text style={styles.subtitle}>Book Finder — ache livros, capas e leituras grátis</Text>
    </View>
  );
});
