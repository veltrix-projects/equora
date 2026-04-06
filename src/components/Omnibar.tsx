"use client";

import { useState } from "react";
import { parseOmnibar } from "@/utils/parser";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Users as UsersIcon, Plus, FileText } from "lucide-react";

export default function Omnibar({ onAdd, onDraft }: { onAdd: (data: any) => void, onDraft: (data: any) => void }) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const parsed = parseOmnibar(input);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed.amount && parsed.description) {
      onAdd(parsed);
      setInput("");
      setIsExpanded(false);
    }
  };

  const handleDraft = () => {
    if (parsed.description) {
      onDraft(parsed);
      setInput("");
      setIsExpanded(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 px-6 z-50">
      <div className="max-w-2xl mx-auto">
        <form 
          onSubmit={handleSubmit}
          className={`glass rounded-[2rem] transition-all duration-300 overflow-hidden ${isExpanded ? 'p-6' : 'p-2'}`}
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Uber 450 @alex @rahul"
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-lg placeholder:text-muted-foreground/30 font-medium"
            />
            {!isExpanded ? (
              <button 
                type="button"
                className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-lg shadow-primary/20"
                onClick={() => setIsExpanded(true)}
              >
                <Plus size={20} />
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-muted-foreground p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-white/5 space-y-6"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Detected</p>
                    <p className="text-xl font-bold flex items-center gap-2">
                      {parsed.description} 
                      {parsed.amount && <span className="text-primary font-black">₹{parsed.amount}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Splitting</p>
                    <div className="flex flex-wrap justify-end gap-1 mt-1">
                      {parsed.mentions.length > 0 ? (
                        parsed.mentions.map(m => (
                          <span key={m} className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-md font-bold">@{m}</span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md italic">Equal Split</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                   <button 
                    type="button"
                    onClick={handleDraft}
                    className="flex-1 glass text-muted-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <FileText size={18} /> Quick Draft
                  </button>
                  <button 
                    type="submit"
                    disabled={!parsed.amount}
                    className="flex-[2] bg-primary text-primary-foreground py-4 rounded-2xl font-black shadow-xl shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
                  >
                    Post Expense
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
