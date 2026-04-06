"use client";

import { useEquoraStore } from "@/store/useEquoraStore";
import { Plus, Users, Wallet } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { groups, balances } = useEquoraStore();

  const totalBalance = balances.reduce((acc, curr) => acc + Number(curr.balance), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equora</h1>
          <p className="text-muted-foreground">Premium Expense Splitting</p>
        </div>
        <button className="glass p-3 rounded-full hover:scale-105 transition-transform">
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-1">Total Balance</p>
          <h2 className={`text-5xl font-black ${totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{Math.abs(totalBalance).toLocaleString()}
          </h2>
          <p className="text-sm mt-2 text-muted-foreground">
            {totalBalance >= 0 ? "You are owed in total" : "You owe in total"}
          </p>
        </div>
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Wallet size={120} />
        </div>
      </motion.div>

      {/* Groups Grid */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Your Splits</h3>
          <button className="text-primary text-sm font-medium">View all</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-5 rounded-2xl flex justify-between items-center group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Users />
                </div>
                <div>
                  <h4 className="font-bold">{group.name}</h4>
                  <p className="text-xs text-muted-foreground">{group.currency}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">₹0</p>
                <p className="text-[10px] uppercase text-muted-foreground">Settled</p>
              </div>
            </motion.div>
          ))}
          
          {/* Empty State / Create New */}
          <div className="border-2 border-dashed border-muted rounded-2xl p-5 flex items-center justify-center text-muted-foreground hover:border-primary transition-colors cursor-pointer">
            <div className="text-center">
              <Plus className="mx-auto mb-2" />
              <p className="text-sm">Create New Group</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
