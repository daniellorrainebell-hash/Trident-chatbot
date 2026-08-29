import { isOnlineFrom } from './onlineDecision';

describe('isOnlineFrom', () => {
  it('is online when the OS says connected and reachable', () => {
    expect(isOnlineFrom({ isConnected: true, isInternetReachable: true })).toBe(true);
  });

  it('is offline when there is no connection', () => {
    expect(isOnlineFrom({ isConnected: false, isInternetReachable: false })).toBe(false);
  });

  it('is offline on a connection that cannot reach the internet', () => {
    // Airplane wifi and captive portals: associated, but nothing gets out.
    expect(isOnlineFrom({ isConnected: true, isInternetReachable: false })).toBe(false);
  });

  it('treats unknown as online, never as offline', () => {
    // Both platforms leave isInternetReachable undefined regularly. A "no
    // connection" screen shown to someone with a connection is the worse error.
    expect(isOnlineFrom({ isConnected: true })).toBe(true);
    expect(isOnlineFrom({})).toBe(true);
    expect(isOnlineFrom({ isConnected: null, isInternetReachable: null })).toBe(true);
  });
});
