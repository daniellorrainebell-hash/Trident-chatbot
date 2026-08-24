import { create } from 'zustand';
import type {
  ConsentRecord,
  NotificationPreferences,
  Profile,
  TrainingProfile,
  UnitPreferences,
} from '@/types';
import { seedProfile, seedTrainingProfile, SEED_USER_ID } from '@/data/seed';

/** Legal document versions currently in force (spec §8). */
export const TERMS_VERSION = '2026-03-01';
export const PRIVACY_VERSION = '2026-03-01';
export const NUTRITION_DISCLAIMER_VERSION = '2026-03-01';

type UserState = {
  profile: Profile | null;
  trainingProfile: TrainingProfile | null;
  consent: ConsentRecord | null;
  notifications: NotificationPreferences;
  onboardingComplete: boolean;
  signedIn: boolean;

  signIn(): void;
  signOut(): void;
  setProfile(profile: Profile): void;
  setTrainingProfile(profile: TrainingProfile): void;
  setUnits(units: UnitPreferences): void;
  acceptConsent(nutritionDisclaimer?: boolean): void;
  toggleNotification(category: keyof NotificationPreferences['enabled']): void;
  completeOnboarding(): void;
};

const defaultNotifications: NotificationPreferences = {
  userId: SEED_USER_ID,
  enabled: {
    contract_deadline: true,
    streak_reminder: true,
    pack_activity: true,
    leaderboard_movement: false,
    nutrition_checkin: true,
    challenge_updates: true,
    // Marketing is off unless asked for.
    product_news: false,
  },
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export const useUserStore = create<UserState>((set, get) => ({
  profile: seedProfile,
  trainingProfile: seedTrainingProfile,
  consent: {
    userId: SEED_USER_ID,
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
    nutritionDisclaimerVersion: null,
    ageConfirmed: true,
    acceptedAt: '2025-08-14T10:00:00.000Z',
  },
  notifications: defaultNotifications,
  onboardingComplete: true,
  signedIn: true,

  signIn() {
    set({ signedIn: true });
  },

  signOut() {
    set({ signedIn: false });
  },

  setProfile(profile) {
    set({ profile });
  },

  setTrainingProfile(trainingProfile) {
    set({ trainingProfile });
  },

  setUnits(units) {
    const { profile } = get();
    if (!profile) return;
    set({ profile: { ...profile, units } });
  },

  /**
   * Consent is recorded against document versions, not as a boolean, so a
   * later revision can prompt exactly the users who accepted an older one.
   */
  acceptConsent(nutritionDisclaimer = false) {
    const { profile, consent } = get();
    set({
      consent: {
        userId: profile?.id ?? SEED_USER_ID,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        nutritionDisclaimerVersion: nutritionDisclaimer
          ? NUTRITION_DISCLAIMER_VERSION
          : (consent?.nutritionDisclaimerVersion ?? null),
        ageConfirmed: true,
        acceptedAt: new Date().toISOString(),
      },
    });
  },

  toggleNotification(category) {
    const { notifications } = get();
    set({
      notifications: {
        ...notifications,
        enabled: { ...notifications.enabled, [category]: !notifications.enabled[category] },
      },
    });
  },

  completeOnboarding() {
    set({ onboardingComplete: true });
  },
}));

/** Has this user accepted the current nutrition disclaimer? (spec §34) */
export function hasAcceptedNutritionDisclaimer(consent: ConsentRecord | null): boolean {
  return consent?.nutritionDisclaimerVersion === NUTRITION_DISCLAIMER_VERSION;
}
