/**
 * PulseWire Community System Types
 */

/* ========== Profiles & Authentication ========== */

export interface Profile {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  cover_url?: string;
  is_verified: boolean;
  verification_badge: boolean;
  reputation_score: number;
  total_followers: number;
  total_following: number;
  total_articles: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  avg_reading_time?: number;
  total_shares: number;
  featured_article_id?: string;
  expertise?: string[];
  languages?: string[];
  social_twitter?: string;
  social_linkedin?: string;
  social_github?: string;
  verified_at?: string;
  suspended_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ProfileStats {
  followers: number;
  following: number;
  articles: number;
  views: number;
  reputation: number;
  badges: Badge[];
  is_following?: boolean;
}

/* ========== Followers ========== */

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  follower?: Profile;
  following?: Profile;
  created_at: string;
}

export interface FollowRequest {
  follower_id: string;
  following_id: string;
}

/* ========== Comments ========== */

export type CommentStatus = 'active' | 'hidden' | 'deleted' | 'flagged';

export interface Comment {
  id: string;
  article_id: string;
  author_id: string;
  author?: Profile;
  parent_comment_id?: string;
  content: string;
  edited_at?: string;
  is_pinned: boolean;
  is_hidden: boolean;
  report_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  replies?: Comment[];
  mentions?: string[];
  status?: CommentStatus;
}

export interface CommentMention {
  id: string;
  comment_id: string;
  mentioned_user_id: string;
  created_at: string;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
}

/* ========== Reactions ========== */

export type ReactionType = 'like' | 'love' | 'clap' | 'wow';

export interface Reaction {
  id: string;
  article_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface ReactionStats {
  like: number;
  love: number;
  clap: number;
  wow: number;
  total: number;
  user_reaction?: ReactionType;
}

/* ========== Polls ========== */

export interface Poll {
  id: string;
  article_id: string;
  creator_id: string;
  question: string;
  options: PollOption[];
  expires_at?: string;
  is_closed: boolean;
  total_votes: number;
  user_vote?: string;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  vote_count: number;
  percentage?: number;
  order: number;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

/* ========== Discussions ========== */

export interface Discussion {
  id: string;
  creator_id: string;
  creator?: Profile;
  title: string;
  content: string;
  ai_summary?: string;
  suggested_tags?: string[];
  moderation?: any;
  category: string;
  is_pinned: boolean;
  is_featured: boolean;
  view_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  replies?: DiscussionReply[];
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  author_id: string;
  author?: Profile;
  parent_reply_id?: string;
  content: string;
  like_count: number;
  is_hidden: boolean;
  user_liked?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  replies?: DiscussionReply[];
}

/* ========== Badges ========== */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
  created_at: string;
}

export interface BadgeCriteria {
  type: 'activity' | 'milestone' | 'reputation' | 'engagement' | 'special';
  threshold?: number;
  condition?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge?: Badge;
  earned_at: string;
}

export enum BadgeType {
  NEW_CONTRIBUTOR = 'New Contributor',
  RISING_WRITER = 'Rising Writer',
  TOP_JOURNALIST = 'Top Journalist',
  TRENDING_AUTHOR = 'Trending Author',
  ELITE_CONTRIBUTOR = 'Elite Contributor',
  COMMUNITY_LEADER = 'Community Leader',
  MOST_TRUSTED = 'Most Trusted',
  FACT_CHECKER = 'Fact Checker',
  AI_EXPERT = 'AI Expert',
  GLOBAL_REPORTER = 'Global Reporter',
}

/* ========== Reputation System ========== */

export type ReputationAction = 
  | 'article_published'
  | 'like_received'
  | 'comment_received'
  | 'share_received'
  | 'follow_received'
  | 'spam'
  | 'fake_news'
  | 'violation';

export interface ReputationLog {
  id: string;
  user_id: string;
  action: ReputationAction;
  points: number;
  reason: string;
  reference_id?: string;
  created_at: string;
}

export const REPUTATION_POINTS = {
  article_published: 10,
  like_received: 1,
  comment_received: 2,
  share_received: 3,
  follow_received: 5,
  spam: -20,
  fake_news: -50,
  violation: -100,
};

/* ========== Notifications ========== */

export type NotificationType = 
  | 'follow'
  | 'comment'
  | 'reply'
  | 'reaction'
  | 'mention'
  | 'share'
  | 'poll_vote'
  | 'badge'
  | 'trending'
  | 'featured';

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  actor?: Profile;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

/* ========== Activity Feed ========== */

export type ActivityType = 
  | 'published'
  | 'commented'
  | 'liked'
  | 'discussed'
  | 'followed'
  | 'badge_earned'
  | 'milestone'
  | 'joined';

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/* ========== Verification System ========== */

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationRequest {
  id: string;
  user_id: string;
  user?: Profile;
  status: VerificationStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/* ========== Community Moderation ========== */

export type ReportType = 'spam' | 'abuse' | 'fake_news' | 'harassment' | 'other';
export type ContentType = 'comment' | 'article' | 'user' | 'discussion';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface CommunityReport {
  id: string;
  reporter_id: string;
  reporter?: Profile;
  report_type: ReportType;
  content_type: ContentType;
  content_id: string;
  reason: string;
  status: ReportStatus;
  ai_flags?: AIDetectionResult;
  reviewed_by?: string;
  action_taken?: string;
  created_at: string;
  updated_at: string;
}

export interface AIDetectionResult {
  spam_score: number;
  hate_speech_score: number;
  abuse_score: number;
  fake_news_score: number;
  duplicate_match?: {
    match_id: string;
    similarity: number;
  };
  flags: string[];
  timestamp: string;
}

/* ========== Community Analytics ========== */

export interface CommunityAnalytics {
  id: string;
  date: string;
  daily_active_users: number;
  new_contributors: number;
  total_articles_published: number;
  total_comments: number;
  total_reactions: number;
  total_poll_votes: number;
  trending_author_id?: string;
  top_article_id?: string;
  created_at: string;
}

export interface DashboardMetrics {
  daily_active_users: number;
  weekly_new_contributors: number;
  monthly_articles: number;
  avg_engagement_rate: number;
  trending_topics: string[];
  top_authors: Profile[];
}

/* ========== Admin Dashboard ========== */

export interface AdminStats {
  total_users: number;
  total_verified_journalists: number;
  total_articles: number;
  total_comments: number;
  pending_reports: number;
  pending_verifications: number;
  suspended_users: number;
  trending_topics: string[];
  top_articles: any[];
  recent_reports: CommunityReport[];
}

/* ========== API Response Types ========== */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/* ========== Form Types ========== */

export interface CreateCommentPayload {
  article_id: string;
  content: string;
  parent_comment_id?: string;
  mentions?: string[];
}

export interface UpdateCommentPayload {
  content: string;
}

export interface CreateDiscussionPayload {
  title: string;
  content: string;
  category: string;
}

export interface CreatePollPayload {
  article_id: string;
  question: string;
  options: string[];
  expires_at?: string;
}

export interface UpdateProfilePayload {
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  cover_url?: string;
  expertise?: string[];
  languages?: string[];
  social_twitter?: string;
  social_linkedin?: string;
  social_github?: string;
}

export interface CreateReportPayload {
  report_type: ReportType;
  content_type: ContentType;
  content_id: string;
  reason: string;
}
