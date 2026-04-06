"use client";

import { useEquoraStore } from "@/store/useEquoraStore";
import { Plus, Users, Wallet, Key, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useGroups } from "@/hooks/useGroups";
import { calculateSettlements, Settlement } from "@/utils/settlement";

export default function Dashboard() {
  const { groups, balances, user, setActiveGroup } = useEquoraStore();
  const { createGroup, joinGroup } = useGroups();
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const totalBalance = balances.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);

  useEffect(() => {
    if (balances.length > 0) {
      setSettlements(calculateSettlements(balances));
    }
  }, [balances]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await createGroup(name, "", user.id);
      } else {
        await joinGroup(inviteCode, user.id);
      }
      setShowAddModal(false);
      setName("");
      setInviteCode("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  const getStatusMessage = () => {
    if (balances.length === 0) return "No active balances.";
    if (Math.abs(totalBalance) < 0.01) return "You are settled 🎉";
    if (totalBalance > 0) return `You are owed ₹${totalBalance.toLocaleString()} ✅`;
    return `You owe ₹${Math.abs(totalBalance).toLocaleString()} 👀`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
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
          <p className="text-sm mt-2 font-medium opacity-80">
            {getStatusMessage()}
          </p>
        </div>
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Wallet size={120} />
        </div>
      </motion.div>

      {/* Settlement Visualization */}
      {settlements.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            Suggested Settlements <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Optimized</span>
          </h3>
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <div key={i} className="glass p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-400/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">OWE</div>
                  <span className="text-sm font-medium">You</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-black text-primary">₹{s.amount}</span>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-sm font-medium">Member</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-400/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">GET</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Groups Grid */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Your Groups</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setActiveGroup(group)}
              className="glass p-5 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Users />
                </div>
                <div>
                  <h4 className="font-bold">{group.name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">{group.invite_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">₹0</p>
                <p className="text-[10px] uppercase text-muted-foreground">Settled</p>
              </div>
            </motion.div>
          ))}
          
          <div 
            onClick={() => { setModalMode('create'); setShowAddModal(true); }}
            className="border-2 border-dashed border-white/10 rounded-2xl p-5 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <div className="text-center">
              <Plus className="mx-auto mb-1" size={20} />
              <p className="text-sm font-medium">Create Group</p>
            </div>
          </div>

          <div 
            onClick={() => { setModalMode('join'); setShowAddModal(true); }}
            className="border-2 border-dashed border-white/10 rounded-2xl p-5 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <div className="text-center">
              <Key className="mx-auto mb-1" size={20} />
              <p className="text-sm font-medium">Join with Code</p>
            </div>
          </div>
        </div>
      </section>

      {/* Add/Join Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass p-8 rounded-3xl w-full max-w-md relative z-10"
            >
              <h3 className="text-2xl font-bold mb-6">
                {modalMode === 'create' ? 'Create New Group' : 'Join a Group'}
              </h3>
              <form onSubmit={handleAction} className="space-y-4">
                {modalMode === 'create' ? (
                  <input 
                    autoFocus
                    placeholder="Group Name (e.g. Trip to Paris)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass bg-transparent px-4 py-3 rounded-xl outline-none border-none"
                    required
                  />
                ) : (
                  <input 
                    autoFocus
                    placeholder="Enter 6-digit code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full glass bg-transparent px-4 py-3 rounded-xl outline-none border-none font-mono text-center tracking-widest"
                    maxLength={6}
                    required
                  />
                )}
                <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold mt-2 shadow-lg shadow-primary/20">
                  {modalMode === 'create' ? 'Create Group' : 'Join Group'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
