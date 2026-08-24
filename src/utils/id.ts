/**
 * Conflict-safe local IDs (spec §13).
 *
 * Workouts are created offline and synced later, so the client mints the ID
 * rather than waiting for the server. A collision would merge two people's
 * sessions, so this uses a v4-shaped random ID rather than a counter.
 *
 * `expo-crypto` would be stronger, but these IDs are identifiers rather than
 * secrets, and this avoids a native dependency in the offline write path.
 */
export function createId(): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8]!;
    } else {
      uuid += hex[(Math.random() * 16) | 0]!;
    }
  }
  return uuid;
}
