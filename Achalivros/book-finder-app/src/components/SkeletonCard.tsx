import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { radius, space, type Palette } from "@/theme/colors";
import { usePalette } from "@/theme/usePalette";

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
      backgroundColor: palette.border,
    },
    body: {
      flex: 1,
      gap: space[2],
      paddingTop: 2,
    },
    line: {
      height: 12,
      borderRadius: 4,
      backgroundColor: palette.border,
    },
  });
}

export const SkeletonCard = memo(function SkeletonCard() {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, easing: Easing.ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]} accessible={false}>
      <View style={styles.cover} />
      <View style={styles.body}>
        <View style={[styles.line, { width: "40%", height: 16 }]} />
        <View style={[styles.line, { width: "85%" }]} />
        <View style={[styles.line, { width: "60%" }]} />
        <View style={[styles.line, { width: "100%" }]} />
      </View>
    </Animated.View>
  );
});
