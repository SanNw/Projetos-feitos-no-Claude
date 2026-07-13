import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts as useAbrilFatface, AbrilFatface_400Regular } from "@expo-google-fonts/abril-fatface";
import {
  useFonts as useMerriweather,
  Merriweather_400Regular,
  Merriweather_700Bold,
  Merriweather_400Regular_Italic,
} from "@expo-google-fonts/merriweather";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { BookList } from "@/components/BookList";
import { useBookSearch } from "@/hooks/useBookSearch";
import { usePalette } from "@/theme/usePalette";

export default function App() {
  const palette = usePalette();
  const [displayFontsLoaded] = useAbrilFatface({ AbrilFatface_400Regular });
  const [bodyFontsLoaded] = useMerriweather({
    Merriweather_400Regular,
    Merriweather_700Bold,
    Merriweather_400Regular_Italic,
  });
  const { status, results, failedSources, query, search } = useBookSearch();

  const fontsReady = displayFontsLoaded && bodyFontsLoaded;

  if (!fontsReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.bg }]}>
        <ActivityIndicator color={palette.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={["top", "bottom"]}>
        <StatusBar style="auto" />
        <Header />
        <SearchBar onSearch={search} isLoading={status === "loading"} />
        <BookList
          status={status}
          results={results}
          query={query}
          failedSources={failedSources}
          onRetry={() => search(query)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
