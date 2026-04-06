import { supabase } from '../lib/supabase/client';
import { useEquoraStore } from '../store/useEquoraStore';

export const useGroups = () => {
  const { setGroups, setActiveGroup } = useEquoraStore();

  const createGroup = async (name: string, description: string, userId: string) => {
    // Generate invite code using the DB function (via RPC)
    const { data: inviteCode } = await supabase.rpc('generate_invite_code');

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin',
      });

    if (memberError) throw memberError;

    return group;
  };

  const joinGroup = async (inviteCode: string, userId: string) => {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (groupError) throw new Error('Invalid invite code');

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
      });

    if (memberError) throw memberError;

    return group;
  };

  const fetchGroups = async (userId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('groups (*)')
      .eq('user_id', userId);

    if (data) {
      const flatGroups = data.map((m: any) => m.groups);
      setGroups(flatGroups);
      return flatGroups;
    }
    return [];
  };

  const getGroupMembers = async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId);
    
    // In a real app, you'd join with a 'profiles' table here.
    // For now, we'll fetch the user IDs to handle splits.
    return data || [];
  };

  return { createGroup, joinGroup, fetchGroups, getGroupMembers };
};
