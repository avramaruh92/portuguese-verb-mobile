import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { VerbSource } from "../dataset/source";
import { resolveVerbs } from "../dataset/source";
import { colors, radius, spacing, typography } from "../theme/tokens";

export const OFFLINE_PILL_TEXT = "Using saved content";

export function isLocalSource(source: VerbSource | null): boolean {
  return source === "local";
}

interface OfflinePillProps {
  // When provided (quiz/results screens), the pill reflects the source the
  // current session was snapshotted with instead of the live resolver, so a
  // background remote retry cannot hide the pill for a session that is still
  // running on bundled content.
  source?: VerbSource | null;
}

export function OfflinePill({ source: sessionSource }: OfflinePillProps = {}) {
  const [resolvedSource, setResolvedSource] = useState<VerbSource | null>(null);
  const useSessionSource = sessionSource !== undefined;

  useEffect(() => {
    if (useSessionSource) return;
    let active = true;
    resolveVerbs().then((result) => {
      if (active) {
        setResolvedSource(result.source);
      }
    });
    return () => {
      active = false;
    };
  }, [useSessionSource]);

  const source = useSessionSource ? sessionSource : resolvedSource;

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
