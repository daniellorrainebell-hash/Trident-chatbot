import { useCallback, useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button, Card, Text } from '@/components';
import { colors, radius, space as sp } from '@/design';
import { useScannerStore } from '@/store/scannerStore';
import { LOOKUP_MESSAGES } from '@/services/scanner/types';
import { SUPPORTED_BARCODE_TYPES } from '@/engines/scanner/barcode';

/**
 * Barcode scanning (Feed spec §22).
 *
 * Camera permission is requested only when this screen opens, never earlier —
 * asking on launch for a feature most sessions never touch is how permission
 * prompts get denied.
 *
 * The scan callback fires many times a second on the same code, so the store
 * locks after the first valid read and everything after it is ignored until
 * the lookup resolves.
 */
export default function BarcodeScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const stage = useScannerStore((s) => s.stage);
  const locked = useScannerStore((s) => s.locked);
  const failure = useScannerStore((s) => s.failure);
  const scanBarcode = useScannerStore((s) => s.scanBarcode);
  const reset = useScannerStore((s) => s.reset);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (stage === 'confirm_product') router.replace('/feed/scanner/confirm');
  }, [stage]);

  const onScanned = useCallback(
    ({ data, type }: { data: string; type: string }) => {
      if (locked) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // The symbology travels with the code. Eight digits could be EAN-8 or
      // UPC-E, and those normalise to different GTINs — only the camera knows.
      void scanBarcode(data, type);
    },
    [locked, scanBarcode],
  );

  if (!permission) {
    return <Shell><Text variant="body" tone="tertiary" center>Preparing the camera…</Text></Shell>;
  }

  if (!permission.granted) {
    return (
      <Shell>
        <Card>
          <Text variant="h3">Camera access needed</Text>
          <Text variant="body" tone="secondary" style={styles.body}>
            The scanner uses your camera to read barcodes. Nothing is recorded, and no image
            leaves your phone.
          </Text>
          {permission.canAskAgain ? (
            <Button label="Allow camera" onPress={() => void requestPermission()} />
          ) : (
            <Button label="Open settings" onPress={() => void Linking.openSettings()} />
          )}
          <Button
            label="Enter food manually"
            variant="ghost"
            onPress={() => router.replace('/feed/scanner/confirm')}
            style={styles.gap}
          />
        </Card>
      </Shell>
    );
  }

  if (stage === 'failed' && failure) {
    const copy = LOOKUP_MESSAGES[failure.code];
    // A code that was never a product barcode has nothing to look up on a
    // label either — its recovery is another scan, and the copy says so. Every
    // other failure means the product is real but the lookup could not answer,
    // where reading the panel is the way through.
    const retry = failure.code === 'BARCODE_INVALID';
    return (
      <Shell>
        <Card marker="warning">
          <Text variant="h3">{copy.title}</Text>
          <Text variant="body" tone="secondary" style={styles.body}>{copy.detail}</Text>
          <Button
            label={copy.action}
            onPress={retry ? reset : () => router.replace('/feed/scanner/label')}
          />
          <Button
            label={retry ? 'Enter it manually' : 'Scan again'}
            variant="secondary"
            onPress={retry ? () => router.replace('/feed/scanner/confirm') : reset}
            style={styles.gap}
          />
        </Card>
      </Shell>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: [...SUPPORTED_BARCODE_TYPES] }}
          onBarcodeScanned={locked ? undefined : onScanned}
        />

        {/* Reticle. Sized to a retail barcode rather than square, so people
            frame the right thing without being told. */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.reticle} />
          <Text variant="bodySmall" tone="secondary" center style={styles.hint}>
            {stage === 'resolving' ? 'Looking it up…' : 'Point at the barcode'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="Scan the label instead"
          variant="secondary"
          onPress={() => router.replace('/feed/scanner/label')}
        />
        <Button label="Cancel" variant="ghost" onPress={() => { reset(); router.back(); }} style={styles.gap} />
      </View>
    </SafeAreaView>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>{children}</View>
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
  reticle: {
    width: '78%',
    aspectRatio: 2.2,
    borderWidth: 2,
    borderColor: colors.text.primary,
    borderRadius: radius.md,
  },
  hint: { marginTop: sp.lg },
  actions: { paddingHorizontal: sp.lg, paddingBottom: sp.lg },
});
