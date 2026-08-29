import * as Network from 'expo-network';
import { isOnlineFrom } from './onlineDecision';

/**
 * Whether the device currently has a usable connection.
 *
 * The resolver needs this synchronously — it decides between "we cannot look
 * this up right now" and "this product does not exist", and those need
 * different screens. So the state is watched once and cached, rather than
 * awaited on every scan.
 *
 * The default is online, and it stays online unless the OS says otherwise.
 * That asymmetry is deliberate: a false "no connection" screen in front of
 * someone who has a connection is worse than a request that fails and reports
 * why. `isInternetReachable` is frequently undefined on both platforms —
 * undefined is not evidence of being offline.
 */
let online = true;

export function isOnline(): boolean {
  return online;
}

/**
 * Start watching. Safe to call more than once; later calls replace the watch
 * rather than stacking listeners.
 */
let subscription: { remove(): void } | null = null;

export async function watchConnectivity(): Promise<void> {
  subscription?.remove();

  try {
    online = isOnlineFrom(await Network.getNetworkStateAsync());
  } catch {
    // No permission, or a platform that will not answer. Assume online — see
    // the asymmetry note above.
    online = true;
  }

  subscription = Network.addNetworkStateListener((state) => {
    online = isOnlineFrom(state);
  });
}

export function stopWatchingConnectivity(): void {
  subscription?.remove();
  subscription = null;
}
