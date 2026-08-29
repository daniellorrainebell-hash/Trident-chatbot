import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
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
 * The captured image is temporary and is not retained (§37): the file is
 * deleted as soon as the recogniser has read it, success or failure.
 */
export type LabelRecogniser = (imageUri: string) => Promise<OcrLine[]>;

let recogniser: LabelRecogniser | null = null;

export function setLabelRecogniser(next: LabelRecogniser | null): void {
  recogniser = next;
}

export default function LabelScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  // Taking a picture before the preview is ready throws on Android and
  // captures the last frame on iOS, so the button waits for the camera.
  const [cameraReady, setCameraReady] = useState(false);
  const camera = useRef<CameraView>(null);
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
    let uri: string | null = null;
    try {
      // Full quality and no skipped processing: OCR reads small print off a
      // curved surface, and a compressed or unrotated frame is the difference
      // between reading "1.2g" and reading nothing.
      const photo = await camera.current?.takePictureAsync({ quality: 1, skipProcessing: false });
      uri = photo?.uri ?? null;
      if (!uri) {
        router.replace('/feed/scanner/confirm');
        return;
      }

      const lines = await recogniser(uri);
      submitLabel(parseLabel(lines));
    } catch {
      router.replace('/feed/scanner/confirm');
    } finally {
      discard(uri);
      setBusy(false);
    }
  }, [submitLabel]);

  // `permission` is null until the hook has read the current status. Falling
  // through to the denied card here showed "Open settings" for a split second
  // to someone who had never been asked.
  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.shell}>
          <Text variant="body" tone="tertiary" center>Preparing the camera…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.shell}>
          <Card>
            <Text variant="h3">Camera access needed</Text>
            <Text variant="body" tone="secondary" style={styles.body}>
              The label scanner uses your camera to read the nutrition panel. The photo is
              temporary and is not kept.
            </Text>
            {permission.canAskAgain ? (
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
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
        <View style={styles.overlay} pointerEvents="none">
          {/* Portrait frame, because a UK nutrition panel is a tall table. */}
          <View style={styles.frame} />
          <Text variant="bodySmall" tone="secondary" center style={styles.hint}>
            Frame the nutrition panel only
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={busy ? 'Reading…' : 'Capture label'}
          loading={busy}
          disabled={!cameraReady}
          onPress={() => void capture()}
        />
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

/**
 * Remove the captured frame.
 *
 * The screen promises the photo is not kept, and a promise about someone's
 * camera roll is one to actually honour. Failure is ignored: a file that
 * cannot be deleted must not turn a successful read into an error.
 */
function discard(uri: string | null): void {
  if (!uri) return;
  try {
    new File(uri).delete();
  } catch {
    /* best effort */
  }
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
