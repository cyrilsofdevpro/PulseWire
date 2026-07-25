import { supabase } from './supabaseClient'

export interface ProfileSummary {
  id: string
  username: string
  profileImage?: string | null
}

async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

export async function getFollowedUserIds(): Promise<string[]> {
  if (!supabase) return []
  const userId = await getCurrentUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (error) {
    console.error('Failed to load followed ids:', error.message)
    return []
  }

  return (data || []).map((row: any) => String(row.following_id))
}

export async function followUser(targetUserId: string): Promise<boolean> {
  if (!supabase) return false
  const userId = await getCurrentUserId()
  if (!userId || userId === targetUserId) return false

  const { error } = await supabase
    .from('follows')
    .upsert(
      { follower_id: userId, following_id: targetUserId },
      { onConflict: 'follower_id,following_id' }
    )

  if (error) {
    console.error('Failed to follow user:', error.message)
    return false
  }

  return true
}

export async function unfollowUser(targetUserId: string): Promise<boolean> {
  if (!supabase) return false
  const userId = await getCurrentUserId()
  if (!userId || userId === targetUserId) return false

  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: userId, following_id: targetUserId })

  if (error) {
    console.error('Failed to unfollow user:', error.message)
    return false
  }

  return true
}

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  if (!supabase) return { followers: 0, following: 0 }
  const { data: followersData, error: followersError } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)
  if (followersError) {
    console.error('Failed to load follower count:', followersError.message)
  }

  const { data: followingData, error: followingError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
  if (followingError) {
    console.error('Failed to load following count:', followingError.message)
  }

  return {
    followers: followersData?.length || 0,
    following: followingData?.length || 0,
  }
}

export async function getFollowersForUser(userId: string): Promise<ProfileSummary[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)

  if (error) {
    console.error('Failed to load followers:', error.message)
    return []
  }

  const ids = (data || []).map((row: any) => String(row.follower_id)).filter(Boolean)
  if (!ids.length) return []

  const { data: profiles, error: profilesError } = await supabase
    .from('users')
    .select('id, username, profileImage')
    .in('id', ids)

  if (profilesError) {
    console.error('Failed to load follower profiles:', profilesError.message)
    return []
  }

  return (profiles || []).map((profile: any) => ({
    id: profile.id,
    username: profile.username || profile.id,
    profileImage: profile.profileImage || null,
  }))
}

export async function getFollowingForUser(userId: string): Promise<ProfileSummary[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (error) {
    console.error('Failed to load following list:', error.message)
    return []
  }

  const ids = (data || []).map((row: any) => String(row.following_id)).filter(Boolean)
  if (!ids.length) return []

  const { data: profiles, error: profilesError } = await supabase
    .from('users')
    .select('id, username, profileImage')
    .in('id', ids)

  if (profilesError) {
    console.error('Failed to load following profiles:', profilesError.message)
    return []
  }

  return (profiles || []).map((profile: any) => ({
    id: profile.id,
    username: profile.username || profile.id,
    profileImage: profile.profileImage || null,
  }))
}
