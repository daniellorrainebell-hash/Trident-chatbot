import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text } from '@/components';
import { colors, radius, space as sp } from '@/design';
import { useScannerStore } from '@/store/scannerStore';
import { parseLabel, type OcrLine } from '@/engines/scanner/label';

/**
 * Nutrition-label capture (Feed spec §23).
 *
 * The fallback when a barcode is missing, wrong, or the packaging has been
 * reformulated since the database last saw it.
 *
 * OCR runs on-device. The recogniser is injected rather than imported so this
 * screen stays testable and so the ML Kit native module — which needs a
 * development build rather than Expo Go — is swappable. Until one is wired in,
 * the screen routes to manual entry rather than pretending to read anything.
 *
 * The captured image is temporary and is not retained (§37).
 */
export type LabelRecogniser = (imageUri: string) => Promise<OcrLine[]>;

let recogniser: LabelRecogniser | null = null;

export function setLabelRecogniser(next: LabelRecogniser | null): void {
  recogniser = next;
}

export default function LabelScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const submitLabel = useScannerStore((s) => s.submitLabel);
  const stage = useScannerStore((s) => s.stage);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (stage === 'confirm_label') router.replace('/feed/scanner/confirm');
  }, [stage]);

  const capture = useCallback(async () => {
    if (!recogniser) {
      // No recogniser wired in yet. Manual entry is honest; a fake OCR result
      // would be worse than none.
      router.replace('/feed/scanner/confirm');
      return;
    }

    setBusy(true);
    try {
      const lines = await recogniser('');
      submitLabel(parseLabel(lines));
    } catch {
      router.replace('/feed/scanner/confirm');
    } finally {
      setBusy(false);
    }
  }, [submitLabel]);

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.shell}>
          <Card>
            <Text variant="h3">Camera access needed</Text>
            <Text variant="body" tone="secondary" style={styles.body}>
              The label scanner uses your camera to read the nutrition panel. The photo is
              temporary and is not kept.
            </Text>
            {permission?.canAskAgain ? (
              <Button label="Allow camera" onPress={() => void requestPermission()} />
            ) : (
              <Button label="Open settings" onPress={() => void Linking.openSettings()} />
            )}
            <Button
              label="Enter it manually"
              variant="ghost"
              onPress={() => router.replace('/feed/scanner/confirm')}
              style={styles.gap}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.cameraWrap}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
        <View style={styles.overlay} pointerEvents="none">
          {/* Portrait frame, because a UK nutrition panel is a tall table. */}
          <View style={styles.frame} />
          <Text variant="bodySmall" tone="secondary" center style={styles.hint}>
            Frame the nutrition panel only
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button label={busy ? 'Reading…' : 'Capture label'} loading={busy} onPress={() => void capture()} />
        <Button
          label="Enter it manually"
          variant="ghost"
          onPress={() => router.replace('/feed/scanner/confirm')}
          style={styles.gap}
        />
        <Text variant="legal" tone="tertiary" center style={styles.notice}>
          Every value is shown for you to check before anything is saved.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },
  shell: { flex: 1, justifyContent: 'center', paddingHorizontal: sp.lg },
  body: { marginTop: sp.sm, marginBottom: sp.lg },
  gap: { marginTop: sp.md },
  cameraWrap: { flex: 1, margin: sp.lg, borderRadius: radius.lg, overflow: 'hidden' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '70%',
    aspectRatio: 0.72,
    borderWidth: 2,
    borderColor: colors.text.primary,
    borderRadius: radius.md,
  },
  hint: { marginTop: sp.lg },
  actions: { paddingHorizontal: sp.lg, paddingBottom: sp.lg },
  notice: { marginTop: sp.md },
});
