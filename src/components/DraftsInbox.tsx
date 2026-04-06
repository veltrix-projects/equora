"use client";

import { useEquoraStore } from "@/store/useEquoraStore";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, CheckCircle, FileText, X } from "lucide-react";
import { useState } from "react";

export default function DraftsInbox({ onClose, onConvert }: { onClose: () => void, onConvert: (draft: any) => void }) {
  const { drafts, setDrafts, user } = useEquoraStore();

  const deleteDraft = async (id: string) => {
    const { error } = await supabase.from('drafts').delete().eq('id', id);
    if (!error) setDrafts(drafts.filter(d => d.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[110] bg-background p-6"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Drafts Inbox <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{drafts.length}</span>
          </h2>
          <button onClick={onClose} className="glass p-2 rounded-full">
            <X size={20} />
          </button>
        </header>

        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <FileText size={48} className="mx-auto mb-4" />
              <p>Your inbox is empty. Use the omnibar to capture quick ideas!</p>
            </div>
          ) : (
            drafts.map((draft, idx) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass p-5 rounded-3xl flex justify-between items-center group"
              >
                <div>
                  <p className="font-bold text-lg">{draft.data.description}</p>
                  <p className="text-sm text-primary font-black">₹{draft.data.amount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase mt-1">
                    Added {new Date(draft.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onConvert(draft)}
                    className="bg-emerald-400/10 text-emerald-400 p-3 rounded-2xl hover:bg-emerald-400/20 transition-colors"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => deleteDraft(draft.id)}
                    className="bg-rose-400/10 text-rose-400 p-3 rounded-2xl hover:bg-rose-400/20 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
