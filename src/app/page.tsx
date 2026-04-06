"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import Omnibar from "@/components/Omnibar";
import AnalyticsSummary from "@/components/AnalyticsSummary";
import ExpenseFeed from "@/components/ExpenseFeed";
import { useEquoraStore } from "@/store/useEquoraStore";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Sparkles } from "lucide-react";

export default function Home() {
  const { user, setUser, activeGroup, setActiveGroup, groups, setGroups, expenses, setExpenses } = useEquoraStore();
  const { fetchGroups, createGroup, joinGroup } = useGroups();
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. Handle Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchGroups(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchGroups(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Expenses for Active Group
  useEffect(() => {
    if (activeGroup) {
      supabase
        .from('expenses')
        .select('*')
        .eq('group_id', activeGroup.id)
        .order('date', { ascending: false })
        .then(({ data }) => setExpenses(data || []));
    }
  }, [activeGroup]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authView === 'login') {
      await supabase.auth.signInWithPassword({ email, password });
    } else {
      await supabase.auth.signUp({ email, password });
    }
  };

  const handleAddExpense = async (parsedData: any) => {
    if (!activeGroup || !user) return;
    
    const requestId = crypto.randomUUID();
    const optimisticExpense = {
      id: requestId, // Temporary ID
      group_id: activeGroup.id,
      paid_by: user.id,
      description: parsedData.description,
      amount: parsedData.amount,
      category: 'general',
      date: new Date().toISOString(),
      optimistic: true
    };

    // Optimistic Update
    const previousExpenses = [...expenses];
    setExpenses([optimisticExpense, ...expenses]);

    try {
      // 1. Get all members to split with
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', activeGroup.id);

      if (!members || members.length === 0) throw new Error("No members found");

      // 2. Insert Expense
      const { data: exp, error: expErr } = await supabase.from('expenses').insert({
        group_id: activeGroup.id,
        paid_by: user.id,
        description: parsedData.description,
        amount: parsedData.amount,
        category: 'general',
        request_id: requestId
      }).select().single();

      if (expErr) throw expErr;

      // 3. Create Splits
      const splitAmount = parsedData.amount / members.length;
      const splits = members.map(m => ({
        expense_id: exp.id,
        user_id: m.user_id,
        amount: Number(splitAmount.toFixed(2))
      }));

      const { error: splitErr } = await supabase.from('splits').insert(splits);
      if (splitErr) throw splitErr;

      // Replace optimistic expense with real one
      setExpenses([exp, ...previousExpenses]);

      // Refresh balances (Triggers handle DB side, we just fetch)
      const { data: updatedBalances } = await supabase
        .from('group_balances')
        .select('*')
        .eq('group_id', activeGroup.id);
      if (updatedBalances) {
         useEquoraStore.getState().setBalances(updatedBalances);
      }
    } catch (error) {
      console.error("Failed to add expense:", error);
      setExpenses(previousExpenses); // Rollback
      alert("Failed to add expense. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass p-8 rounded-3xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black flex items-center justify-center gap-2">Equora <Sparkles className="text-primary" /></h1>
            <p className="text-muted-foreground mt-2">Sign in to manage your group splits</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full glass bg-transparent px-4 py-3 rounded-xl outline-none border-none" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full glass bg-transparent px-4 py-3 rounded-xl outline-none border-none" required />
            <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold mt-4 shadow-lg shadow-primary/20">
              {authView === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <button onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')} className="w-full text-center mt-6 text-sm text-muted-foreground hover:text-foreground">
            {authView === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background relative pb-20">
      <nav className="p-6 flex justify-between items-center max-w-4xl mx-auto">
         <span className="font-bold text-xl">Equora</span>
         <button onClick={() => supabase.auth.signOut()} className="glass p-2 rounded-lg text-rose-400"><LogOut size={18} /></button>
      </nav>

      {!activeGroup ? (
        <Dashboard />
      ) : (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
           <header className="flex items-center gap-4">
              <button onClick={() => setActiveGroup(null)} className="glass p-2 rounded-xl text-sm">← Back</button>
              <h1 className="text-2xl font-bold">{activeGroup.name}</h1>
              <span className="text-xs glass px-2 py-1 rounded text-muted-foreground font-mono">#{activeGroup.invite_code}</span>
           </header>
           
           <AnalyticsSummary expenses={currentExpenses} />
           
           <section>
             <h3 className="text-lg font-semibold italic mb-4">Recent Activity</h3>
             <ExpenseFeed expenses={expenses} />
           </section>
        </div>
      )}

      {activeGroup && <Omnibar onAdd={handleAddExpense} />}
    </main>
  );
}
