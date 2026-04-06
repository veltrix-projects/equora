"use client";

import { useState } from "react";
import { parseOmnibar } from "@/utils/parser";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Users as UsersIcon } from "lucide-react";

export default function Omnibar({ onAdd }: { onAdd: (data: any) => void }) {
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

  return (
    <div className="fixed bottom-8 left-0 right-0 px-6 z-50">
      <div className="max-w-2xl mx-auto">
        <form 
          onSubmit={handleSubmit}
          className={`glass rounded-3xl transition-all duration-300 overflow-hidden ${isExpanded ? 'p-6' : 'p-2'}`}
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Uber 450 with @alex @rahul"
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-lg placeholder:text-muted-foreground/50"
            />
            {!isExpanded ? (
              <button 
                type="button"
                className="bg-primary text-primary-foreground p-3 rounded-2xl"
                onClick={() => setIsExpanded(true)}
              >
                <Send size={20} />
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-muted-foreground p-2"
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
                className="mt-4 pt-4 border-t border-white/10 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-muted-foreground">Preview</p>
                    <p className="text-xl font-bold">
                      {parsed.description} 
                      {parsed.amount && <span className="text-primary ml-2">₹{parsed.amount}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-muted-foreground">Splitting with</p>
                    <div className="flex gap-1 mt-1">
                      {parsed.mentions.length > 0 ? (
                        parsed.mentions.map(m => (
                          <span key={m} className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full">@{m}</span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Everyone</span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!parsed.amount}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Add Expense
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
