export type Group = {
  id: string;
  name: string;
  description?: string;
  currency: string;
  invite_code: string;
  created_at: string;
  created_by: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
};

export type Expense = {
  id: string;
  group_id: string;
  paid_by: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  is_recurring: boolean;
  is_draft: boolean;
};

export type Split = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage?: number;
};

export type GroupBalance = {
  group_id: string;
  user_id: string;
  balance: number;
  updated_at: string;
};
