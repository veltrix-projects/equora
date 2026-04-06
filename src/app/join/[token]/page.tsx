"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useEquoraStore } from "@/store/useEquoraStore";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

export default function JoinPage() {
  const { token } = useParams();
  const router = useRouter();
  const { user, setActiveGroup } = useEquoraStore();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

  useEffect(() => {
    async function join() {
      if (!user) {
        // Redirect to login if not logged in, but save token first
        localStorage.setItem('join_token', token as string);
        router.push('/');
        return;
      }

      try {
        // 1. Find group with this invite code
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('invite_code', token as string)
          .single();

        if (groupError || !group) throw new Error("Invalid invite link");

        // 2. Add user to group
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: group.id,
            user_id: user.id
          });
        
        // If already a member, memberError will exist but it's okay
        if (memberError && memberError.code !== '23505') throw memberError;

        setActiveGroup(group);
        setStatus('success');
        setTimeout(() => router.push('/'), 1500);
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    }

    if (token) join();
  }, [token, user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-10 rounded-[3rem] text-center max-w-sm w-full">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold">Verifying Invite...</h2>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-400/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-black">Joined Group! 🎉</h2>
            <p className="text-muted-foreground">Taking you to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-rose-400/20 text-rose-400 rounded-full flex items-center justify-center mx-auto font-black text-2xl">
              !
            </div>
            <h2 className="text-2xl font-black">Link Expired</h2>
            <p className="text-muted-foreground">This invite link is invalid or has expired.</p>
            <button onClick={() => router.push('/')} className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold">Back Home</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
