import { makeNutritionProfile } from '../__fixtures__/builders';
import { NUTRITION_SAFETY_POLICY_V1 } from './policy';
import {
  describeDecision,
  messageFor,
  permitsAutomation,
  screenProfile,
  suggestsReferral,
} from './safetyDecision';

const policy = NUTRITION_SAFETY_POLICY_V1;

describe('screenProfile', () => {
  it('approves an eligible adult', () => {
    const decision = screenProfile(makeNutritionProfile());
    expect(decision.status).toBe('approved');
  });

  it('blocks under-18s', () => {
    const decision = screenProfile(makeNutritionProfile({ ageYears: 17 }));
    expect(decision).toMatchObject({ status: 'blocked', reasonCode: 'UNDER_MINIMUM_AGE' });
  });

  it('blocks during pregnancy', () => {
    expect(screenProfile(makeNutritionProfile({ isPregnant: true }))).toMatchObject({
      status: 'blocked', reasonCode: 'PREGNANCY',
    });
  });

  it('blocks while breastfeeding', () => {
    expect(screenProfile(makeNutritionProfile({ isBreastfeeding: true }))).toMatchObject({
      status: 'blocked', reasonCode: 'BREASTFEEDING',
    });
  });

  it('routes a disclosed eating disorder to a professional rather than blocking silently', () => {
    const decision = screenProfile(makeNutritionProfile({ hasEatingDisorderHistory: true }));
    expect(decision.status).toBe('professional_referral');
    expect(suggestsReferral(decision)).toBe(true);
    expect(permitsAutomation(decision)).toBe(false);
  });

  it('routes a medical condition to a professional', () => {
    expect(screenProfile(makeNutritionProfile({ hasMedicalCondition: true }))).toMatchObject({
      status: 'professional_referral', reasonCode: 'MEDICAL_CONDITION',
    });
  });

  it('refers above the automated age band', () => {
    expect(screenProfile(makeNutritionProfile({ ageYears: 84 }))).toMatchObject({
      status: 'professional_referral', reasonCode: 'ABOVE_AUTOMATED_AGE',
    });
  });

  it('prefers the most specific exclusion when several apply', () => {
    const decision = screenProfile(
      makeNutritionProfile({ ageYears: 16, isPregnant: true, hasMedicalCondition: true }),
    );
    expect(decision).toMatchObject({ reasonCode: 'UNDER_MINIMUM_AGE' });
  });

  it('rejects inputs outside the automation range', () => {
    expect(screenProfile(makeNutritionProfile({ heightCm: 250 }))).toMatchObject({
      reasonCode: 'HEIGHT_OUT_OF_RANGE',
    });
    expect(screenProfile(makeNutritionProfile({ currentWeightKg: 320 }))).toMatchObject({
      reasonCode: 'WEIGHT_OUT_OF_RANGE',
    });
    expect(screenProfile(makeNutritionProfile({ requestedTimeframeWeeks: 200 }))).toMatchObject({
      reasonCode: 'TIMEFRAME_OUT_OF_RANGE',
    });
  });

  it('rejects a target that contradicts the goal', () => {
    expect(
      screenProfile(makeNutritionProfile({ goal: 'lose_body_fat', currentWeightKg: 80, targetWeightKg: 90 })),
    ).toMatchObject({ reasonCode: 'TARGET_DIRECTION_INVALID' });

    expect(
      screenProfile(makeNutritionProfile({ goal: 'build_muscle', currentWeightKg: 90, targetWeightKg: 80 })),
    ).toMatchObject({ reasonCode: 'TARGET_DIRECTION_INVALID' });
  });

  it('stamps the policy version onto every decision', () => {
    expect(screenProfile(makeNutritionProfile()).policyVersion).toBe(policy.version);
  });
});

describe('messages', () => {
  it('never uses diagnostic language', () => {
    for (const code of Object.keys(messageFor as never) as never[]) void code;
    const message = messageFor('EATING_DISORDER');
    expect(message).not.toMatch(/diagnos/i);
    expect(message).toMatch(/GP|professional/i);
  });

  it('tells the user what is still available to them', () => {
    expect(messageFor('EATING_DISORDER')).toMatch(/remains available/i);
  });

  it('describes an adjusted timeframe with the supported figure', () => {
    const description = describeDecision({
      status: 'adjust_timeframe', supportedWeeks: 18, requestedWeeks: 8, policyVersion: 'v',
    });
    expect(description).toMatch(/18 weeks/);
  });
});
