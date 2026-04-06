"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import Omnibar from "@/components/Omnibar";
import AnalyticsSummary from "@/components/AnalyticsSummary";
import ExpenseFeed from "@/components/ExpenseFeed";
import { useEquoraStore } from "@/store/useEquoraStore";
import { motion } from "framer-motion";

export default function Home() {
  const { activeGroup } = useEquoraStore();
  const [view, setView] = useState<'dashboard' | 'group'>('dashboard');

  // Mock data for initial phase
  const mockExpenses = [
    { id: '1', description: 'Groceries', amount: 1200, category: 'food', date: new Date().toISOString() },
    { id: '2', description: 'Electricity', amount: 3500, category: 'utilities', date: new Date().toISOString() },
  ] as any;

  return (
    <main className="min-h-screen bg-background relative pb-20">
      {view === 'dashboard' ? (
        <div onClick={() => setView('group')}>
           <Dashboard />
        </div>
      ) : (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
           <header className="flex items-center gap-4">
              <button onClick={() => setView('dashboard')} className="glass p-2 rounded-xl text-sm">← Back</button>
              <h1 className="text-2xl font-bold">Trip to Goa</h1>
           </header>
           
           <AnalyticsSummary />
           
           <section>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold italic">Recent Activity</h3>
                <div className="flex gap-2">
                   <span className="bg-emerald-400/10 text-emerald-400 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-tighter">Settled</span>
                </div>
             </div>
             <ExpenseFeed expenses={mockExpenses} />
           </section>
        </div>
      )}

      <Omnibar onAdd={(data) => console.log('Adding:', data)} />
    </main>
  );
}
