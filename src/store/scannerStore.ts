import { create } from 'zustand';
import type { NutrientBasis, ParsedLabel } from '@/engines/scanner/label';
import type { NutrientVector, ScannedProductNutrition } from '@/engines/scanner/portions';
import type { ProductLookupFailure, ResolvedProduct } from '@/services/scanner/types';
import { CachedProductResolver, MemoryProductCache } from '@/services/scanner/resolver';
import { createId } from '@/utils/id';
import type { PreferenceLevel } from '@/engines/food/eligibility';

/**
 * Food scanner state (Feed spec §21–§28).
 *
 * The flow is deliberately three steps with a confirmation in the middle:
 * scan, confirm, then act. Nothing a scanner produces — provider data or OCR —
 * touches a plan before the user has confirmed it against the packaging in
 * front of them.
 */

export type ScannerMode = 'idle' | 'barcode' | 'label' | 'manual';

export type ScanStage =
  | 'home'
  | 'scanning'
  | 'resolving'
  | 'confirm_product'
  | 'confirm_label'
  | 'portion'
  | 'failed';

export type SavedFood = {
  id: string;
  name: string;
  brand?: string;
  gtin?: string;
  basis: NutrientBasis;
  nutrients: NutrientVector;
  servingSizeG?: number;
  packQuantity?: number;
  packUnit?: 'g' | 'ml';
  source: 'barcode' | 'label' | 'manual';
  verificationStatus: ResolvedProduct['verificationStatus'];
  categoryTags: string[];
  preference?: PreferenceLevel | 'cant_eat';
  savedAt: string;
  /** Private by default. Never published without moderation and consent (§24). */
  private: boolean;
};

type ScannerState = {
  mode: ScannerMode;
  stage: ScanStage;
  /** Locks the camera after the first valid read (§22). */
  locked: boolean;

  product: ResolvedProduct | null;
  parsedLabel: ParsedLabel | null;
  failure: ProductLookupFailure | null;
  pendingNutrition: ScannedProductNutrition | null;

  myFoods: SavedFood[];
  resolver: CachedProductResolver;

  openScanner(mode: ScannerMode): void;
  close(): void;
  scanBarcode(raw: string): Promise<void>;
  submitLabel(label: ParsedLabel): void;
  confirmNutrition(nutrition: ScannedProductNutrition): void;
  saveToMyFoods(input: Omit<SavedFood, 'id' | 'savedAt' | 'private'>): SavedFood;
  setPreference(foodId: string, preference: PreferenceLevel | 'cant_eat'): void;
  removeSavedFood(foodId: string): void;
  reset(): void;
};

export const useScannerStore = create<ScannerState>((set, get) => ({
  mode: 'idle',
  stage: 'home',
  locked: false,

  product: null,
  parsedLabel: null,
  failure: null,
  pendingNutrition: null,

  myFoods: [],
  // Providers are injected at startup; on device this chain sits in front of
  // SQLite and a server-side proxy that holds the provider credentials.
  resolver: new CachedProductResolver([new MemoryProductCache()], []),

  openScanner(mode) {
    set({ mode, stage: mode === 'manual' ? 'confirm_label' : 'scanning', locked: false, failure: null });
  },

  close() {
    set({ mode: 'idle', stage: 'home', locked: false });
  },

  /**
   * Resolve a scanned barcode.
   *
   * Guarded by `locked` because the camera fires the same code many times a
   * second; without it every frame starts another lookup.
   */
  async scanBarcode(raw) {
    if (get().locked) return;
    set({ locked: true, stage: 'resolving' });

    const result = await get().resolver.resolve(raw);

    if (result.ok) {
      set({
        product: result.product,
        stage: 'confirm_product',
        pendingNutrition: {
          basis: result.product.basis,
          basisQuantity: result.product.basis === 'per_serving' ? (result.product.servingQuantity ?? 1) : 100,
          nutrients: result.product.nutrients,
          servingSizeG: result.product.servingUnit === 'g' ? result.product.servingQuantity : undefined,
          packQuantity: result.product.packQuantity,
          packUnit: result.product.packUnit,
        },
      });
      return;
    }

    set({ failure: result.failure, stage: 'failed', product: null });
  },

  submitLabel(label) {
    set({ parsedLabel: label, stage: 'confirm_label' });
  },

  confirmNutrition(nutrition) {
    set({ pendingNutrition: nutrition, stage: 'portion' });
  },

  saveToMyFoods(input) {
    const food: SavedFood = {
      ...input,
      id: createId(),
      savedAt: new Date().toISOString(),
      private: true,
    };
    set({ myFoods: [...get().myFoods, food] });
    return food;
  },

  setPreference(foodId, preference) {
    set({
      myFoods: get().myFoods.map((food) =>
        food.id === foodId ? { ...food, preference } : food,
      ),
    });
  },

  removeSavedFood(foodId) {
    set({ myFoods: get().myFoods.filter((food) => food.id !== foodId) });
  },

  reset() {
    set({
      mode: 'idle', stage: 'home', locked: false,
      product: null, parsedLabel: null, failure: null, pendingNutrition: null,
    });
  },
}));
