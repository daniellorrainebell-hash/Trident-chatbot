import { create } from 'zustand';
import type { Contract, ContractMetric, ContractVisibility } from '@/types';
import { createId } from '@/utils/id';
import { seedContracts, SEED_USER_ID } from '@/data/seed';
import type { PersistedDocument } from './persistence';

/**
 * Contracts (spec §17).
 *
 * There is no `deleteContract` action, and that is deliberate: a failed Contract
 * stays in the record. The only way one leaves `active` is by being met or by
 * running out of time.
 */

export type ContractState = {
  contracts: Contract[];
  createContract(input: {
    title: string;
    metric: ContractMetric;
    target: number;
    unit: string;
    startDate: string;
    endDate: string;
    visibility: ContractVisibility;
    exerciseId?: string;
    exerciseName?: string;
  }): Contract;
  activateContract(id: string): void;
  /** Called by the progress engine when a Contract resolves. */
  markCompleted(id: string): void;
  markFailed(id: string): void;
  abandonDraft(id: string): void;
};

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: seedContracts,

  createContract(input) {
    const contract: Contract = {
      id: createId(),
      userId: SEED_USER_ID,
      title: input.title,
      metric: input.metric,
      target: input.target,
      unit: input.unit,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'draft',
      visibility: input.visibility,
      verification: 'logged',
      exerciseId: input.exerciseId,
      exerciseName: input.exerciseName,
      createdAt: new Date().toISOString(),
      completedAt: null,
      failedAt: null,
    };
    set({ contracts: [...get().contracts, contract] });
    return contract;
  },

  activateContract(id) {
    set({
      contracts: get().contracts.map((c) =>
        c.id === id && c.status === 'draft' ? { ...c, status: 'active' } : c,
      ),
    });
  },

  markCompleted(id) {
    set({
      contracts: get().contracts.map((c) =>
        c.id === id && c.status === 'active'
          ? { ...c, status: 'completed', completedAt: new Date().toISOString() }
          : c,
      ),
    });
  },

  markFailed(id) {
    set({
      contracts: get().contracts.map((c) =>
        c.id === id && c.status === 'active'
          ? { ...c, status: 'failed', failedAt: new Date().toISOString() }
          : c,
      ),
    });
  },

  /**
   * A draft was never signed, so removing it erases nothing. An active,
   * completed or failed Contract cannot be removed by any path.
   */
  abandonDraft(id) {
    set({
      contracts: get().contracts.filter((c) => !(c.id === id && c.status === 'draft')),
    });
  },
}));

/**
 * Contracts are a promise with a deadline, so losing them on restart would be
 * the app breaking the promise for you. The whole list persists — met, failed
 * and active alike, because a failed Contract staying in the record is the
 * point of them.
 */
export const CONTRACT_DOCUMENT: PersistedDocument<ContractState, Pick<ContractState, 'contracts'>> = {
  key: 'contracts',
  version: 1,
  select: (s) => ({ contracts: s.contracts }),
  merge: (data) => data,
};
