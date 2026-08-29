/**
 * Is this network state evidence of being offline?
 *
 * Pure, and separate from the expo-network module, so the rule can be tested
 * without a platform. The rule is asymmetric on purpose: only a definite "no"
 * from the OS counts as offline. `isInternetReachable` is frequently undefined
 * on both platforms, and treating unknown as offline puts a "no connection"
 * screen in front of someone who has one — worse than letting the request run
 * and reporting why it failed.
 */
export type NetworkFacts = {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

export function isOnlineFrom(state: NetworkFacts): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}
