"use client";

import { Expense } from "@/types";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Smile } from "lucide-react";

export default function ExpenseFeed({ expenses }: { expenses: Expense[] }) {
  return (
    <div className="space-y-4 pb-32">
      {expenses.map((expense, idx) => (
        <motion.div
          key={expense.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: expense.optimistic ? 0.5 : 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`glass p-4 rounded-2xl flex justify-between items-center group ${expense.optimistic ? 'animate-pulse' : ''}`}
        >
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
              {getCategoryEmoji(expense.category)}
            </div>
            <div>
              <h5 className="font-semibold">{expense.description}</h5>
              <p className="text-xs text-muted-foreground">
                Paid by <span className="text-foreground font-medium">You</span> • {format(new Date(expense.date), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">₹{expense.amount.toLocaleString()}</p>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
              <Smile size={16} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function getCategoryEmoji(category: string) {
  const map: Record<string, string> = {
    food: '🍔',
    travel: '✈️',
    rent: '🏠',
    utilities: '💡',
    general: '💰'
  };
  return map[category] || '📦';
}
