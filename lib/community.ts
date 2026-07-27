/**
 * Community System Utilities
 */

import { supabase } from './supabaseClient';
import { supabaseAdmin } from './supabaseAdmin';
import type {
  Profile,
  Follower,
  Comment,
  Discussion,
  DiscussionReply,
  Reaction,
  ReactionType,
  Notification,
  ReputationLog,
  ReputationAction,
  REPUTATION_POINTS,
  CommunityReport,
  ReportType,
  ContentType,
  AIDetectionResult,
} from '../types/community';

/* ========== Profile Operations ========== */

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .eq('suspended_at', null)
    .single();

  if (error) {
    console.error('Error fetching profile by username:', error);
    return null;
  }

  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

/* ========== Follower Operations ========== */

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  try {
    // Check if already following
    const { data: existing } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (existing) return false;

    // Insert follow relationship
    const { error: followError } = await supabase
      .from('followers')
      .insert({ follower_id: followerId, following_id: followingId });

    if (followError) throw followError;

    // Update follower counts
    await Promise.all([
      supabase.rpc('increment_followers', { user_id: followingId }),
      supabase.rpc('increment_following', { user_id: followerId }),
    ]);

    // Create notification
    await createNotification(followingId, followerId, 'follow', 'New follower', `${followerId} started following you`);

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;

    // Update follower counts
    await Promise.all([
      supabase.rpc('decrement_followers', { user_id: followingId }),
      supabase.rpc('decrement_following', { user_id: followerId }),
    ]);

    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  return !!data && !error;
}

export async function getFollowers(userId: string, limit = 20, offset = 0): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('followers')
    .select('follower_id, profiles!followers_follower_id_fkey(*)')
    .eq('following_id', userId)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching followers:', error);
    return [];
  }

  return data?.map((f: any) => f.profiles).filter(Boolean) || [];
}

/* ========== Comment Operations ========== */

export async function createComment(
  articleId: string,
  authorId: string,
  content: string,
  parentCommentId?: string
): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_id: articleId,
        author_id: authorId,
        parent_comment_id: parentCommentId || null,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Award reputation
    await addReputationLog(authorId, 'comment_received', 2, 'Comment posted');

    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
}

export async function getComments(articleId: string, limit = 50): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:author_id (*)
    `)
    .eq('article_id', articleId)
    .eq('parent_comment_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data || [];
}

export async function updateComment(commentId: string, content: string): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .update({ content, edited_at: new Date().toISOString() })
    .eq('id', commentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    return null;
  }

  return data;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId);

  return !error;
}

/* ========== Reaction Operations ========== */

export async function addReaction(
  articleId: string,
  userId: string,
  reactionType: ReactionType
): Promise<Reaction | null> {
  try {
    // Delete existing reaction if exists
    await supabase.from('reactions').delete().eq('article_id', articleId).eq('user_id', userId);

    // Insert new reaction
    const { data, error } = await supabase
      .from('reactions')
      .insert({ article_id: articleId, user_id: userId, reaction_type: reactionType })
      .select()
      .single();

    if (error) throw error;

    // Award reputation
    await addReputationLog(userId, 'like_received', 1, `${reactionType} reaction`);

    return data;
  } catch (error) {
    console.error('Error adding reaction:', error);
    return null;
  }
}

export async function removeReaction(articleId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId);

  return !error;
}

export async function getReactionStats(articleId: string): Promise<Record<ReactionType, number>> {
  const { data, error } = await supabase
    .from('reactions')
    .select('reaction_type')
    .eq('article_id', articleId);

  if (error) {
    console.error('Error fetching reaction stats:', error);
    return { like: 0, love: 0, clap: 0, wow: 0 };
  }

  const stats = { like: 0, love: 0, clap: 0, wow: 0 };
  data?.forEach(r => {
    stats[r.reaction_type as ReactionType]++;
  });

  return stats;
}

/* ========== Reputation System ========== */

export async function addReputationLog(
  userId: string,
  action: ReputationAction,
  points: number,
  reason: string,
  referenceId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reputation_logs')
      .insert({
        user_id: userId,
        action,
        points,
        reason,
        reference_id: referenceId,
      });

    if (error) throw error;

    // Update profile reputation score
    const profile = await getProfile(userId);
    if (profile) {
      await updateProfile(userId, {
        reputation_score: profile.reputation_score + points,
      });
    }

    return true;
  } catch (error) {
    console.error('Error adding reputation log:', error);
    return false;
  }
}

export async function getUserReputation(userId: string): Promise<number> {
  const profile = await getProfile(userId);
  return profile?.reputation_score || 0;
}

/* ========== Notifications ========== */

export async function createNotification(
  userId: string,
  actorId: string,
  type: string,
  title: string,
  message: string,
  referenceId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type,
        title,
        message,
        reference_id: referenceId,
      });

    return !error;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

export async function getNotifications(userId: string, limit = 20, unreadOnly = false): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  return !error;
}

/* ========== Community Reports ========== */

export async function createReport(
  reporterId: string,
  reportType: ReportType,
  contentType: ContentType,
  contentId: string,
  reason: string
): Promise<CommunityReport | null> {
  try {
    const { data, error } = await supabase
      .from('community_reports')
      .insert({
        reporter_id: reporterId,
        report_type: reportType,
        content_type: contentType,
        content_id: contentId,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating report:', error);
    return null;
  }
}

export async function getReports(limit = 50, offset = 0, status?: string): Promise<CommunityReport[]> {
  let query = supabase
    .from('community_reports')
    .select(`
      *,
      reporter:reporter_id (*)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  return data || [];
}

/* ========== Badge System ========== */

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const profile = await getProfile(userId);
  if (!profile) return [];

  const awardedBadges: string[] = [];
  const badges = [
    {
      name: 'Rising Writer',
      condition: () => profile.total_articles >= 5 && profile.reputation_score >= 50,
    },
    {
      name: 'Top Journalist',
      condition: () => profile.total_articles >= 20 && profile.reputation_score >= 200,
    },
    {
      name: 'Trending Author',
      condition: () => profile.total_views >= 10000,
    },
    {
      name: 'Elite Contributor',
      condition: () => profile.reputation_score >= 500,
    },
    {
      name: 'Community Leader',
      condition: () => profile.total_followers >= 100,
    },
  ];

  for (const badge of badges) {
    if (badge.condition()) {
      // Check if already awarded
      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .match({ 'badge.name': badge.name })
        .single();

      if (!existing) {
        // Get badge ID and award it
        const { data: badgeData } = await supabase
          .from('badges')
          .select('id')
          .eq('name', badge.name)
          .single();

        if (badgeData) {
          await supabase
            .from('user_badges')
            .insert({ user_id: userId, badge_id: badgeData.id });

          awardedBadges.push(badge.name);

          // Notify user
          await createNotification(
            userId,
            userId,
            'badge',
            `New Badge: ${badge.name}`,
            `Congratulations! You've earned the ${badge.name} badge.`
          );
        }
      }
    }
  }

  return awardedBadges;
}

/* ========== Activity Feed ========== */

export async function addActivityFeedItem(
  userId: string,
  activityType: string,
  title: string,
  description: string,
  referenceId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activity_feed')
      .insert({
        user_id: userId,
        activity_type: activityType,
        title,
        description,
        reference_id: referenceId,
        metadata,
      });

    return !error;
  } catch (error) {
    console.error('Error adding activity feed item:', error);
    return false;
  }
}

export async function getActivityFeed(userId: string, limit = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity feed:', error);
    return [];
  }

  return data || [];
}

/* ========== Discussion Operations ========== */

export async function createDiscussion(
  creatorId: string,
  title: string,
  content: string,
  category: string,
  userInfo?: any,
  aiData?: { ai_summary?: string; suggested_tags?: string[]; moderation?: any }
): Promise<Discussion | null> {
  try {
    const client = supabaseAdmin || supabase;
    // Ensure a minimal profile exists for the creator to satisfy FK constraints
    try {
      const usernameFallback = `user_${creatorId.slice(0, 8)}`;
      const profilePayload: any = {
        id: creatorId,
        username: usernameFallback,
        created_at: new Date().toISOString(),
      };

      // If we have user info from auth, include common fields to satisfy stricter constraints
      if (userInfo) {
        if (userInfo.email) profilePayload.email = userInfo.email;
        if (userInfo.user_metadata?.name) profilePayload.full_name = userInfo.user_metadata.name;
        if (userInfo.user_metadata?.full_name) profilePayload.full_name = userInfo.user_metadata.full_name;
        if (userInfo.user_metadata?.avatar_url) profilePayload.avatar_url = userInfo.user_metadata.avatar_url;
      }

      // Ensure required name fields are present to satisfy DB NOT NULL constraints
      const nameFromMeta = userInfo?.user_metadata?.name || userInfo?.user_metadata?.full_name || null;
      if (nameFromMeta) {
        const parts = String(nameFromMeta).trim().split(/\s+/);
        profilePayload.first_name = parts.shift() || 'User';
        profilePayload.last_name = parts.join(' ') || '';
      } else if (profilePayload.email) {
        // derive a simple first name from email local-part
        const local = String(profilePayload.email).split('@')[0] || 'User';
        profilePayload.first_name = local.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
        profilePayload.last_name = '';
      } else {
        profilePayload.first_name = 'User';
        profilePayload.last_name = '';
      }

      // Retry upsert a few times to handle transient network errors
      let upsertError: any = null;
      let upsertData: any = null;
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await client.from('profiles').upsert(profilePayload, { onConflict: 'id' });
          upsertData = res.data;
          upsertError = res.error;
          if (!upsertError) break;
          console.warn(`Profile upsert attempt ${attempt} failed for ${creatorId}:`, upsertError.message || upsertError);
        } catch (err) {
          upsertError = err;
          console.warn(`Profile upsert attempt ${attempt} threw for ${creatorId}:`, err && (err.message || err));
        }

        // small delay before retrying
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 250 * attempt));
        }
      }

      if (upsertError) {
        console.warn('Profile upsert error for creator', creatorId, upsertError);
      }
    } catch (e) {
      // non-fatal; log and continue — insertion may still fail if DB constraints stricter
      console.warn('Warning: could not upsert minimal profile for creator', creatorId, e);
    }
    const insertPayload: any = {
      creator_id: creatorId,
      title,
      content,
      category,
    };

    if (aiData?.ai_summary) insertPayload.ai_summary = aiData.ai_summary;
    if (aiData?.suggested_tags) insertPayload.suggested_tags = aiData.suggested_tags;
    if (aiData?.moderation) insertPayload.moderation = aiData.moderation;

    const { data, error } = await client
      .from('discussions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    await addActivityFeedItem(
      creatorId,
      'discussion_created',
      'Discussion created',
      `Started discussion: ${title}`,
      data.id,
      { category }
    );

    return data;
  } catch (error) {
    console.error('Error creating discussion:', error);
    return null;
  }
}

export async function getDiscussions(limit = 50, offset = 0): Promise<Discussion[]> {
  const { data, error } = await supabase
    .from('discussions')
    .select(`
      *,
      creator:creator_id (*)
    `)
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching discussions:', error);
    return [];
  }

  return data || [];
}

export async function getDiscussionById(discussionId: string): Promise<Discussion | null> {
  const { data, error } = await supabase
    .from('discussions')
    .select(`
      *,
      creator:creator_id (*)
    `)
    .eq('id', discussionId)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Error fetching discussion:', error);
    return null;
  }

  return data;
}

export async function addDiscussionReply(
  discussionId: string,
  authorId: string,
  content: string,
  parentReplyId?: string
): Promise<DiscussionReply | null> {
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('discussion_replies')
      .insert({
        discussion_id: discussionId,
        author_id: authorId,
        parent_reply_id: parentReplyId || null,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    const discussion = await getDiscussionById(discussionId);
    if (discussion) {
      await supabase
        .from('discussions')
        .update({ reply_count: discussion.reply_count + 1 })
        .eq('id', discussionId);
    }

    await addActivityFeedItem(
      authorId,
      'discussion_replied',
      'Replied to discussion',
      `Replied to discussion`,
      discussionId
    );

    return data;
  } catch (error) {
    console.error('Error adding discussion reply:', error);
    return null;
  }
}

export async function getDiscussionReplies(discussionId: string): Promise<DiscussionReply[]> {
  const { data, error } = await supabase
    .from('discussion_replies')
    .select(`
      *,
      author:author_id (*)
    `)
    .eq('discussion_id', discussionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching discussion replies:', error);
    return [];
  }

  return data || [];
}
