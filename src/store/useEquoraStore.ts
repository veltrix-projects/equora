import { create } from 'zustand';
import { Group, GroupBalance } from '../types';

interface EquoraState {
  user: any | null;
  groups: Group[];
  activeGroup: Group | null;
  balances: GroupBalance[];
  setUser: (user: any) => void;
  setGroups: (groups: Group[]) => void;
  setActiveGroup: (group: Group | null) => void;
  setBalances: (balances: GroupBalance[]) => void;
}

export const useEquoraStore = create<EquoraState>((set) => ({
  user: null,
  groups: [],
  activeGroup: null,
  balances: [],
  setUser: (user) => set({ user }),
  setGroups: (groups) => set({ groups }),
  setActiveGroup: (group) => set({ activeGroup: group }),
  setBalances: (balances) => set({ balances }),
}));
