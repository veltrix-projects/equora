import { supabase } from '../lib/supabase/client';
import { useEquoraStore } from '../store/useEquoraStore';
import { Expense, Split } from '../types';

export const useExpenses = (groupId: string) => {
  const { setBalances } = useEquoraStore();

  const fetchBalances = async () => {
    const { data, error } = await supabase
      .from('group_balances')
      .select('*')
      .eq('group_id', groupId);

    if (data) setBalances(data);
    return { data, error };
  };

  const addExpense = async (
    expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>,
    splits: Omit<Split, 'id' | 'expense_id'>[]
  ) => {
    // 1. Create Expense
    const { data: expData, error: expError } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();

    if (expError) throw expError;

    // 2. Create Splits
    const splitsWithId = splits.map((s) => ({
      ...s,
      expense_id: expData.id,
    }));

    const { error: splitError } = await supabase
      .from('splits')
      .insert(splitsWithId);

    if (splitError) throw splitError;

    // Refresh balances (Trigger handles the logic in DB)
    await fetchBalances();

    return expData;
  };

  return { addExpense, fetchBalances };
};
