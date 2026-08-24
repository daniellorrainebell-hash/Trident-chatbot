/** Unit handling. Everything is stored metric; display converts at the edge. */

export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';
export type DistanceUnit = 'km' | 'mi';

export type UnitPreferences = {
  weight: WeightUnit;
  length: LengthUnit;
  distance: DistanceUnit;
};

export const DEFAULT_UNITS: UnitPreferences = {
  weight: 'kg',
  length: 'cm',
  distance: 'km',
};

/**
 * ISO-8601 date, no time component: 'YYYY-MM-DD'.
 * Streaks, contracts and check-ins are day-grained, and storing them as instants
 * invites timezone bugs where a 23:50 session lands on the wrong day.
 */
export type IsoDate = string;

/** ISO-8601 instant with timezone. */
export type IsoDateTime = string;

export type Uuid = string;
