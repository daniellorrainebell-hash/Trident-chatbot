/**
 * Analytics (spec §70).
 *
 * Wrapped behind one module so PostHog — or whatever replaces it — is a single
 * swap. The event list is closed on purpose: an open `track(name, props)` is how
 * health data ends up in an analytics pipeline by accident.
 *
 * Spec §70 is explicit that sensitive raw health and nutrition data must not be
 * sent unnecessarily. So no event below carries a calorie target, a bodyweight,
 * a macro figure or a health flag — only that something happened, and coarse
 * shape information that cannot identify a person's body.
 */

export type AnalyticsEvent =
  | { name: 'onboarding_complete'; properties: { primaryActivity: string; goal: string } }
  | { name: 'workout_started'; properties: { source: 'blank' | 'template' | 'repeat' } }
  | { name: 'workout_completed'; properties: { exerciseCount: number; workingSets: number; durationMinutes: number; prCount: number } }
  | { name: 'contract_created'; properties: { metric: string; durationDays: number } }
  | { name: 'contract_completed'; properties: { metric: string } }
  | { name: 'contract_failed'; properties: { metric: string; completionFraction: number } }
  | { name: 'pack_joined'; properties: Record<string, never> }
  | { name: 'challenge_joined'; properties: Record<string, never> }
  | { name: 'meal_plan_generated'; properties: { mealsPerDay: number; splitTrainingDays: boolean; failureCount: number } }
  | { name: 'meal_swapped'; properties: { mealType: string } }
  | { name: 'plan_exported'; properties: { format: 'xlsx' } }
  | { name: 'weekly_checkin_completed'; properties: { weeksObserved: number } }
  | { name: 'adjustment_suggested'; properties: { direction: 'increase' | 'decrease' } }
  | { name: 'adjustment_accepted'; properties: { direction: 'increase' | 'decrease' } }
  | { name: 'nutrition_blocked'; properties: { kind: string } };

export interface AnalyticsClient {
  identify(userId: string): void;
  track(event: AnalyticsEvent): void;
  reset(): void;
}

/**
 * Development sink. Replaced by the PostHog adapter at startup; if that never
 * happens, events are logged rather than silently dropped, so a missing wire-up
 * is visible during development instead of at launch.
 */
class ConsoleAnalytics implements AnalyticsClient {
  identify(userId: string): void {
    if (__DEV__) console.log('[analytics] identify', userId);
  }

  track(event: AnalyticsEvent): void {
    if (__DEV__) console.log('[analytics]', event.name, event.properties);
  }

  reset(): void {
    if (__DEV__) console.log('[analytics] reset');
  }
}

let client: AnalyticsClient = new ConsoleAnalytics();

export function setAnalyticsClient(next: AnalyticsClient): void {
  client = next;
}

export function track(event: AnalyticsEvent): void {
  client.track(event);
}

export function identify(userId: string): void {
  client.identify(userId);
}

export function resetAnalytics(): void {
  client.reset();
}
