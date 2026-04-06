"use server";

import { generateGroupInsights } from "@/lib/gemini";
import { supabase } from "@/lib/supabase/client";

export async function getSmartInsights(groupId: string, groupName: string, expenses: any[]) {
  // 1. Check Cache
  const { data: cached } = await supabase
    .from('cached_insights')
    .select('*')
    .eq('group_id', groupId)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached) return cached.insights;

  // 2. Check Daily Limit
  const { data: usage } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('group_id', groupId)
    .eq('usage_date', new Date().toISOString().split('T')[0])
    .single();

  if (usage && usage.count >= 1) {
    return { summary: "Daily limit reached. Insights refreshed tomorrow.", tip: "Review your expenses manually.", biggest_category: "N/A" };
  }

  // 3. Generate New Insights
  const insights = await generateGroupInsights(groupName, expenses);

  if (insights) {
    // Save to Cache
    await supabase.from('cached_insights').insert({
      group_id: groupId,
      insights,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Update Usage
    await supabase.rpc('increment_ai_usage', { p_group_id: groupId });
  }

  return insights;
}
