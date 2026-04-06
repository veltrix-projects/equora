import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Group, GroupBalance } from '../types';

interface EquoraState {
  user: any | null;
  groups: Group[];
  activeGroup: Group | null;
  balances: GroupBalance[];
  expenses: any[];
  drafts: any[];
  setUser: (user: any) => void;
  setGroups: (groups: Group[]) => void;
  setActiveGroup: (group: Group | null) => void;
  setBalances: (balances: GroupBalance[]) => void;
  setExpenses: (expenses: any[]) => void;
  setDrafts: (drafts: any[]) => void;
}

export const useEquoraStore = create<EquoraState>()(
  persist(
    (set) => ({
      user: null,
      groups: [],
      activeGroup: null,
      balances: [],
      expenses: [],
      drafts: [],
      setUser: (user) => set({ user }),
      setGroups: (groups) => set({ groups }),
      setActiveGroup: (group) => set({ activeGroup: group }),
      setBalances: (balances) => set({ balances }),
      setExpenses: (expenses) => set({ expenses }),
      setDrafts: (drafts) => set({ drafts }),
    }),
    {
      name: 'equora-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        groups: state.groups,
        activeGroup: state.activeGroup,
        balances: state.balances,
        expenses: state.expenses,
        drafts: state.drafts,
      }),
    }
  )
);
