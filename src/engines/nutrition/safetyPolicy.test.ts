import { makeNutritionProfile } from '../__fixtures__/builders';
import {
  DEFAULT_NUTRITION_POLICY,
  checkEligibility,
  clampCalories,
  energyFloor,
  validateManualTargets,
} from './safetyPolicy';

describe('checkEligibility', () => {
  it('approves an eligible adult without suggesting a referral', () => {
    const decision = checkEligibility(makeNutritionProfile());
    expect(decision.approved).toBe(true);
    expect(decision.kind).toBe('approved');
    expect(decision.referralSuggested).toBe(false);
  });

  it('blocks under-18s and routes them to a professional', () => {
    const decision = checkEligibility(makeNutritionProfile({ ageYears: 17 }));
    expect(decision.approved).toBe(false);
    expect(decision.kind).toBe('blocked_age');
    expect(decision.referralSuggested).toBe(true);
  });

  it('blocks during pregnancy', () => {
    const decision = checkEligibility(makeNutritionProfile({ isPregnant: true }));
    expect(decision.approved).toBe(false);
    expect(decision.kind).toBe('blocked_pregnancy');
  });

  it('blocks while breastfeeding', () => {
    const decision = checkEligibility(makeNutritionProfile({ isBreastfeeding: true }));
    expect(decision.approved).toBe(false);
    expect(decision.kind).toBe('blocked_breastfeeding');
  });

  it('blocks on a disclosed eating disorder history', () => {
    const decision = checkEligibility(
      makeNutritionProfile({ hasEatingDisorderHistory: true }),
    );
    expect(decision.approved).toBe(false);
    expect(decision.kind).toBe('blocked_eating_disorder');
    expect(decision.referralSuggested).toBe(true);
  });

  it('blocks on a disclosed medical condition', () => {
    const decision = checkEligibility(makeNutritionProfile({ hasMedicalCondition: true }));
    expect(decision.approved).toBe(false);
    expect(decision.kind).toBe('blocked_medical');
  });

  it('prefers the most specific exclusion when several apply', () => {
    const decision = checkEligibility(
      makeNutritionProfile({ ageYears: 16, isPregnant: true, hasMedicalCondition: true }),
    );
    expect(decision.kind).toBe('blocked_age');
  });

  it('allows but flags a referral above the supported age band', () => {
    const decision = checkEligibility(makeNutritionProfile({ ageYears: 80 }));
    expect(decision.approved).toBe(true);
    expect(decision.referralSuggested).toBe(true);
  });

  it('stamps every decision with the policy version that produced it', () => {
    const decision = checkEligibility(makeNutritionProfile());
    expect(decision.policyVersion).toBe(DEFAULT_NUTRITION_POLICY.version);
  });

  it('never returns clinical or diagnostic language', () => {
    const decision = checkEligibility(
      makeNutritionProfile({ hasEatingDisorderHistory: true }),
    );
    expect(decision.message).not.toMatch(/diagnos/i);
    expect(decision.message).toMatch(/professional|GP/i);
  });
});

describe('clampCalories', () => {
  const profile = makeNutritionProfile();
  const maintenance = 2800;

  it('leaves a target inside the band untouched', () => {
    const result = clampCalories(2400, maintenance, profile);
    expect(result.clamped).toBe(false);
    expect(result.calories).toBe(2400);
  });

  it('clamps an aggressive deficit to the policy cap', () => {
    const result = clampCalories(1200, maintenance, profile);
    expect(result.clamped).toBe(true);
    expect(result.reason).toBe('deficit_cap');
    // 25% below 2800
    expect(result.calories).toBe(2100);
  });

  it('clamps an excessive surplus to the policy cap', () => {
    const result = clampCalories(4000, maintenance, profile);
    expect(result.clamped).toBe(true);
    expect(result.reason).toBe('surplus_cap');
    expect(result.calories).toBe(3220);
  });

  it('applies the absolute energy floor to a small maintenance', () => {
    // A 25% deficit from 1800 is 1350, below the 1500 male floor.
    const result = clampCalories(1000, 1800, profile);
    expect(result.calories).toBe(energyFloor(profile));
    expect(result.reason).toBe('energy_floor');
  });

  it('uses a sex-specific floor', () => {
    const female = makeNutritionProfile({ sex: 'female' });
    expect(energyFloor(female)).toBe(1200);
    expect(energyFloor(makeNutritionProfile())).toBe(1500);
  });
});

describe('validateManualTargets', () => {
  const profile = makeNutritionProfile();

  it('approves an advanced user setting a sensible target', () => {
    const decision = validateManualTargets(2400, 2800, profile);
    expect(decision.approved).toBe(true);
    expect(decision.adjustment).toBeUndefined();
  });

  it('does not let a manual override bypass the safety band', () => {
    const decision = validateManualTargets(900, 2800, profile);
    expect(decision.adjustment?.requested).toBe(900);
    expect(decision.adjustment?.supported).toBe(2100);
    expect(decision.adjustment?.supported).toBeGreaterThan(900);
  });
});
