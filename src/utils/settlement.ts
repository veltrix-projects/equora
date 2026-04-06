import { GroupBalance } from '../types';

export type Settlement = {
  from: string;
  to: string;
  amount: number;
};

export function calculateSettlements(balances: GroupBalance[]): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Separate users into those who owe and those who are owed
  let creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);
    
  let debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
    .sort((a, b) => b.balance - a.balance);

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].balance, debtors[j].balance);
    
    if (amount > 0.01) {
      settlements.push({
        from: debtors[j].user_id,
        to: creditors[i].user_id,
        amount: Number(amount.toFixed(2)),
      });
    }

    creditors[i].balance -= amount;
    debtors[j].balance -= amount;

    if (creditors[i].balance < 0.01) i++;
    if (debtors[j].balance < 0.01) j++;
  }

  return settlements;
}
