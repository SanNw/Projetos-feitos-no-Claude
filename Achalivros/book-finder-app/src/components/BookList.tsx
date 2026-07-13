import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { BookResult, BookSource } from "@/types";
import type { SearchStatus } from "@/hooks/useBookSearch";
import { fonts, radius, space, type Palette } from "@/theme/colors";
import { usePalette } from "@/theme/usePalette";
import { BookCard } from "./BookCard";
import { SkeletonCard } from "./SkeletonCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

const SOURCE_LABEL: Record<BookSource, string> = {
  gutenberg: "Project Gutenberg",
  google: "Google Books",
  openlibrary: "Open Library",
};

const SKELETON_ITEMS = Array.from({ length: 6 }, (_, i) => `skeleton-${i}`);

function createStyles(palette: Palette) {
  return StyleSheet.create({
    listContent: {
      paddingHorizontal: space[4],
      paddingBottom: space[6],
    },
    separator: {
      height: space[3],
    },
    warning: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.fgMuted,
      backgroundColor: palette.bgAlt,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: radius,
      padding: space[2],
      marginBottom: space[3],
    },
  });
}

interface Props {
  status: SearchStatus;
  results: BookResult[];
  query: string;
  failedSources: BookSource[];
  onRetry: () => void;
}

export function BookList({ status, results, query, failedSources, onRetry }: Props) {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);

  if (status === "idle") return <EmptyState variant="initial" />;
  if (status === "error") return <ErrorState onRetry={onRetry} />;

  const warning =
    status === "success" && failedSources.length > 0 ? (
      <Text style={styles.warning} accessibilityRole="alert">
        {failedSources.map((s) => SOURCE_LABEL[s]).join(", ")} não respondeu desta vez — mostrando
        resultados das demais fontes.
      </Text>
    ) : null;

  if (status === "loading") {
    return (
      <View style={{ flex: 1 }}>
        {warning}
        <FlashList
          data={SKELETON_ITEMS}
          renderItem={() => <SkeletonCard />}
          estimatedItemSize={160}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {warning}
        <EmptyState variant="no-results" query={query} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={results}
        renderItem={({ item }) => <BookCard book={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={160}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={warning}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
