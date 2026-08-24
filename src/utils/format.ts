import type { DistanceUnit, LengthUnit, WeightUnit } from '@/types';

/**
 * Display formatting.
 *
 * Everything is stored metric and converted here at the edge, so a user
 * switching units never rewrites their history — the numbers underneath are
 * unchanged (spec §9).
 */

const KG_TO_LB = 2.20462;
const CM_TO_IN = 0.393701;
const KM_TO_MI = 0.621371;

export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kg * KG_TO_LB : kg;
}

export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / KG_TO_LB : value;
}

export function formatWeight(kg: number, unit: WeightUnit = 'kg', dp = 1): string {
  const value = toDisplayWeight(kg, unit);
  // Whole numbers read cleaner on a bar: "100 kg", not "100.0 kg".
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(dp);
  return `${rounded} ${unit}`;
}

export function formatLength(cm: number, unit: LengthUnit = 'cm'): string {
  if (unit === 'cm') return `${Math.round(cm)} cm`;
  const totalInches = cm * CM_TO_IN;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

export function formatDistance(metres: number, unit: DistanceUnit = 'km'): string {
  const km = metres / 1000;
  const value = unit === 'mi' ? km * KM_TO_MI : km;
  return `${value.toFixed(2)} ${unit}`;
}

/**
 * Volume gets abbreviated because the raw figure is unreadable at a glance:
 * "1.24M kg" lands, "1,243,880 kg" does not.
 */
export function formatVolume(kg: number, unit: WeightUnit = 'kg'): string {
  const value = toDisplayWeight(kg, unit);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${unit}`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k ${unit}`;
  return `${Math.round(value).toLocaleString('en-GB')} ${unit}`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-GB');
}

/** Session length: "1h 12m" reads faster than "72 minutes". */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.round(seconds)}s`;
}

/** Timer readout: mm:ss, or h:mm:ss past an hour. */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function formatWeekday(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    timeZone: 'UTC',
  });
}

/** Relative time for The Yard. Falls back to a date past a week. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatShortDate(iso);
}

export function formatPercent(fraction: number, dp = 0): string {
  return `${(fraction * 100).toFixed(dp)}%`;
}

/** "1st", "2nd", "3rd" for leaderboard positions. */
export function formatRank(rank: number): string {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  switch (rank % 10) {
    case 1: return `${rank}st`;
    case 2: return `${rank}nd`;
    case 3: return `${rank}rd`;
    default: return `${rank}th`;
  }
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
