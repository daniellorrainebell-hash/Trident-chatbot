import type { IsoDate, IsoDateTime, Uuid, UnitPreferences } from './units';
import type { PrimaryActivity, TrainingExperience, TrainingGoal, ActivityLevel } from './nutrition';

export type Profile = {
  id: Uuid;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  dateOfBirth: IsoDate;
  countryCode: string;
  gym?: string;
  town?: string;
  memberSince: IsoDate;
  units: UnitPreferences;
  bio?: string;
  isPrivate: boolean;
};

export type TrainingProfile = {
  userId: Uuid;
  primaryActivity: PrimaryActivity;
  experience: TrainingExperience;
  goal: TrainingGoal;
  sessionsPerWeek: number;
  averageSessionMinutes: number;
  /** Self-reported 1–5. Feeds the score's consistency weighting, nothing medical. */
  perceivedIntensity: 1 | 2 | 3 | 4 | 5;
  dailyActivityLevel: ActivityLevel;
};

/**
 * Versioned consent (spec §8). Storing the version rather than a boolean means a
 * re-consent prompt can target exactly the users who accepted an older document.
 */
export type ConsentRecord = {
  userId: Uuid;
  termsVersion: string;
  privacyVersion: string;
  nutritionDisclaimerVersion: string | null;
  ageConfirmed: boolean;
  acceptedAt: IsoDateTime;
};

export type NotificationCategory =
  | 'contract_deadline'
  | 'streak_reminder'
  | 'pack_activity'
  | 'leaderboard_movement'
  | 'nutrition_checkin'
  | 'challenge_updates'
  | 'product_news';

export type NotificationPreferences = {
  userId: Uuid;
  enabled: Record<NotificationCategory, boolean>;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

export type OnboardingStep =
  | 'account'
  | 'consent'
  | 'profile'
  | 'training'
  | 'goal'
  | 'units'
  | 'complete';
