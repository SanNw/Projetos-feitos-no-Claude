import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import type { BookResult } from "@/types";
import { fonts, radius, space, type Palette } from "@/theme/colors";
import { usePalette } from "@/theme/usePalette";

const SOURCE_LABEL: Record<BookResult["source"], string> = {
  gutenberg: "Domínio público",
  google: "Google Books",
  openlibrary: "Open Library",
};

function createStyles(palette: Palette) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      gap: space[3],
      backgroundColor: palette.bgAlt,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: radius,
      padding: space[3],
    },
    cover: {
      width: 88,
      height: 132,
      borderRadius: 4,
      backgroundColor: palette.bg,
      borderWidth: 1,
      borderColor: palette.border,
    },
    coverPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    coverPlaceholderText: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: palette.primary,
    },
    body: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    badge: {
      alignSelf: "flex-start",
      fontFamily: fonts.bodyBold,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: palette.fgMuted,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
      overflow: "hidden",
    },
    badgeFree: {
      color: palette.accentFg,
      backgroundColor: palette.accent,
      borderColor: "transparent",
    },
    title: {
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      color: palette.fg,
    },
    meta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.fgMuted,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: space[2],
      marginTop: "auto",
      paddingTop: space[1],
      alignItems: "center",
    },
    link: {
      minHeight: 32,
      justifyContent: "center",
    },
    linkText: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      color: palette.primary,
    },
    downloadButton: {
      minHeight: 32,
      paddingHorizontal: 10,
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.accent,
    },
    downloadButtonPressed: {
      backgroundColor: palette.accent,
    },
    downloadText: {
      fontFamily: fonts.bodyBold,
      fontSize: 11,
      color: palette.accent,
    },
    downloadTextPressed: {
      color: palette.accentFg,
    },
  });
}

interface Props {
  book: BookResult;
}

export const BookCard = memo(function BookCard({ book }: Props) {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const authors = book.authors.length > 0 ? book.authors.join(", ") : "Autor desconhecido";

  const openLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  return (
    <View style={styles.card}>
      {book.thumbnail ? (
        <Image
          source={{ uri: book.thumbnail }}
          style={styles.cover}
          contentFit="cover"
          accessibilityLabel={`Capa de ${book.title}`}
          transition={150}
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>{book.title.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={[styles.badge, book.source === "gutenberg" && styles.badgeFree]}>
          {SOURCE_LABEL[book.source]}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {authors}
          {book.publishedDate ? ` · ${book.publishedDate}` : ""}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={styles.link}
            hitSlop={8}
            onPress={() => openLink(book.infoLink)}
            accessibilityRole="link"
            accessibilityLabel={`Mais informações sobre ${book.title}`}
          >
            <Text style={styles.linkText}>Mais informações ↗</Text>
          </Pressable>

          {book.downloads?.epub && (
            <Pressable
              hitSlop={8}
              onPress={() => openLink(book.downloads!.epub!)}
              accessibilityRole="link"
              accessibilityLabel={`Baixar ${book.title} em EPUB`}
              style={({ pressed }) => [styles.downloadButton, pressed && styles.downloadButtonPressed]}
            >
              {({ pressed }) => (
                <Text style={[styles.downloadText, pressed && styles.downloadTextPressed]}>EPUB</Text>
              )}
            </Pressable>
          )}

          {book.downloads?.pdf && (
            <Pressable
              hitSlop={8}
              onPress={() => openLink(book.downloads!.pdf!)}
              accessibilityRole="link"
              accessibilityLabel={`Baixar ${book.title} em PDF`}
              style={({ pressed }) => [styles.downloadButton, pressed && styles.downloadButtonPressed]}
            >
              {({ pressed }) => (
                <Text style={[styles.downloadText, pressed && styles.downloadTextPressed]}>PDF</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
});
