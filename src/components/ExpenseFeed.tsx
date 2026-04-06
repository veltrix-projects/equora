"use client";

import { Expense } from "@/types";
import { useEquoraStore } from "@/store/useEquoraStore";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Smile } from "lucide-react";

export default function ExpenseFeed({ expenses }: { expenses: any[] }) {
  const { user } = useEquoraStore();

  return (
    <div className="space-y-4 pb-32">
      {expenses.map((expense, idx) => {
        const isYou = expense.paid_by === user?.id;
        return (
          <motion.div
            key={expense.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: expense.optimistic ? 0.5 : 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`glass p-4 rounded-3xl flex justify-between items-center group transition-all hover:bg-white/5 ${expense.optimistic ? 'animate-pulse' : ''}`}
          >
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-xl shadow-inner">
                {getCategoryEmoji(expense.category)}
              </div>
              <div>
                <h5 className="font-bold text-foreground">{expense.description}</h5>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {isYou ? "You" : "Member"} paid ₹{expense.amount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-lg text-primary">₹{(expense.amount / 2).toLocaleString()}</p>
              <p className="text-[8px] uppercase text-muted-foreground font-bold">Your Share</p>
            </div>
          </motion.div>
        );
      })}
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
