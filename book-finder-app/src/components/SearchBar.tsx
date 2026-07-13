import { memo, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fonts, radius, space, type Palette } from "@/theme/colors";
import { usePalette } from "@/theme/usePalette";

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: space[4],
      paddingBottom: space[3],
    },
    row: {
      flexDirection: "row",
      gap: space[2],
      backgroundColor: palette.bgAlt,
      borderWidth: 2,
      borderColor: palette.border,
      borderRadius: radius,
      padding: 4,
      alignItems: "center",
    },
    input: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: space[3],
      fontFamily: fonts.body,
      fontSize: 16,
      color: palette.fg,
    },
    button: {
      minHeight: 44,
      minWidth: 88,
      paddingHorizontal: space[3],
      borderRadius: radius - 2,
      backgroundColor: palette.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontFamily: fonts.bodyBold,
      fontSize: 14,
      color: palette.accentFg,
    },
  });
}

interface Props {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar = memo(function SearchBar({ onSearch, isLoading }: Props) {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [value, setValue] = useState("");

  const disabled = isLoading || value.trim().length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Título, autor ou assunto…"
          placeholderTextColor={palette.fgMuted}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={() => onSearch(value)}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Buscar livros por título, autor ou assunto"
        />
        <Pressable
          onPress={() => onSearch(value)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          hitSlop={8}
          style={({ pressed }) => [
            styles.button,
            disabled && styles.buttonDisabled,
            pressed && !disabled && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{isLoading ? "Buscando…" : "Buscar"}</Text>
        </Pressable>
      </View>
    </View>
  );
});
