import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { VerbSource } from "../dataset/source";
import { resolveVerbs } from "../dataset/source";
import { colors, radius, spacing, typography } from "../theme/tokens";

export const OFFLINE_PILL_TEXT = "Using saved content";

export function isLocalSource(source: VerbSource | null): boolean {
  return source === "local";
}

export function OfflinePill() {
  const [source, setSource] = useState<VerbSource | null>(null);

  useEffect(() => {
    let active = true;
    resolveVerbs().then((result) => {
      if (active) {
        setSource(result.source);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!isLocalSource(source)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{OFFLINE_PILL_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm / 2,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.caption,
    color: colors.info,
  },
});
