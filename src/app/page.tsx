"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import Omnibar from "@/components/Omnibar";
import AnalyticsSummary from "@/components/AnalyticsSummary";
import ExpenseFeed from "@/components/ExpenseFeed";
import DraftsInbox from "@/components/DraftsInbox";
import { useEquoraStore } from "@/store/useEquoraStore";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Sparkles, Inbox, Bell } from "lucide-react";

export default function Home() {
  const { user, setUser, activeGroup, setActiveGroup, groups, setGroups, expenses, setExpenses, drafts, setDrafts } = useEquoraStore();
  const { fetchGroups, createGroup, joinGroup } = useGroups();
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDrafts, setShowDrafts] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);

  // 1. Handle Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchGroups(session.user.id);
        fetchDrafts(session.user.id);
        checkNudges(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchGroups(session.user.id);
        fetchDrafts(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDrafts = async (userId: string) => {
    const { data } = await supabase.from('drafts').select('*').eq('user_id', userId);
    if (data) setDrafts(data);
  };

  const checkNudges = async (userId: string) => {
    // Simple nudge logic
    const { data: recentExpenses } = await supabase
      .from('expenses')
      .select('created_at')
      .eq('paid_by', userId)
      .limit(1);
    
    if (!recentExpenses || recentExpenses.length === 0) {
      setNudge("You haven't added expenses yet! Try capturing a quick draft.");
    } else {
      const lastExp = new Date(recentExpenses[0].created_at);
      const diff = Date.now() - lastExp.getTime();
      if (diff > 7 * 24 * 60 * 60 * 1000) {
        setNudge("It's been a week since your last split. Anything new to add? 👀");
      }
    }
  };

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

      // Refresh balances
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

  const handleAddDraft = async (parsedData: any) => {
    if (!user) return;
    const { data: draft, error } = await supabase.from('drafts').insert({
      user_id: user.id,
      group_id: activeGroup?.id || null,
      data: parsedData
    }).select().single();

    if (draft) setDrafts([draft, ...drafts]);
  };

  const handleConvertDraft = async (draft: any) => {
    if (!activeGroup) {
      alert("Please select a group first to convert this draft.");
      setShowDrafts(false);
      return;
    }
    await handleAddExpense(draft.data);
    const { error } = await supabase.from('drafts').delete().eq('id', draft.id);
    if (!error) setDrafts(drafts.filter(d => d.id !== draft.id));
    setShowDrafts(false);
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
         <span className="font-bold text-xl flex items-center gap-2">Equora <Sparkles size={16} className="text-primary" /></span>
         <div className="flex gap-2">
            <button 
              onClick={() => setShowDrafts(true)}
              className="glass p-2 rounded-lg text-muted-foreground relative"
            >
              <Inbox size={18} />
              {drafts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] text-primary-foreground flex items-center justify-center rounded-full font-black">
                  {drafts.length}
                </span>
              )}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="glass p-2 rounded-lg text-rose-400"><LogOut size={18} /></button>
         </div>
      </nav>

      <AnimatePresence>
        {nudge && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 max-w-4xl mx-auto mb-4"
          >
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center gap-3">
              <Bell className="text-primary" size={20} />
              <p className="text-sm font-medium flex-1">{nudge}</p>
              <button onClick={() => setNudge(null)} className="text-muted-foreground"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDrafts && (
          <DraftsInbox onClose={() => setShowDrafts(false)} onConvert={handleConvertDraft} />
        )}
      </AnimatePresence>

      {!activeGroup ? (
        <Dashboard />
      ) : (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
           <header className="flex items-center gap-4">
              <button onClick={() => setActiveGroup(null)} className="glass p-2 rounded-xl text-sm">← Back</button>
              <h1 className="text-2xl font-bold">{activeGroup.name}</h1>
              <span className="text-xs glass px-2 py-1 rounded text-muted-foreground font-mono">#{activeGroup.invite_code}</span>
           </header>
           
           <AnalyticsSummary expenses={expenses} />
           
           <section>
             <h3 className="text-lg font-semibold italic mb-4">Recent Activity</h3>
             <ExpenseFeed expenses={expenses} />
           </section>
        </div>
      )}

      <Omnibar onAdd={handleAddExpense} onDraft={handleAddDraft} />
    </main>
  );
}
