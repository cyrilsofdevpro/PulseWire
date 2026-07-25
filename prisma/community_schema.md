# PulseWire Community Database Schema

## Tables

### profiles (extends existing auth.users)
- id: uuid (PK, FK to auth.users)
- username: text UNIQUE
- bio: text
- location: text
- website: text
- avatar_url: text
- cover_url: text
- is_verified: boolean
- verification_badge: boolean
- reputation_score: int (default 0)
- total_followers: int (default 0)
- total_following: int (default 0)
- total_articles: int (default 0)
- total_views: bigint (default 0)
- total_likes: int (default 0)
- total_comments: int (default 0)
- avg_reading_time: float
- total_shares: int (default 0)
- featured_article_id: uuid (FK)
- expertise: text[] (array of topics)
- languages: text[] (array of languages)
- social_twitter: text
- social_linkedin: text
- social_github: text
- verified_at: timestamp
- suspended_at: timestamp (NULL if active)
- created_at: timestamp
- updated_at: timestamp
- deleted_at: timestamp (soft delete)

### followers
- id: uuid (PK)
- follower_id: uuid (FK to profiles)
- following_id: uuid (FK to profiles)
- created_at: timestamp
- UNIQUE(follower_id, following_id)

### comments
- id: uuid (PK)
- article_id: uuid (FK to articles/posts)
- author_id: uuid (FK to profiles)
- parent_comment_id: uuid (FK to comments, NULL if top-level)
- content: text
- edited_at: timestamp
- is_pinned: boolean (default false)
- is_hidden: boolean (default false)
- report_count: int (default 0)
- created_at: timestamp
- updated_at: timestamp
- deleted_at: timestamp

### comment_mentions
- id: uuid (PK)
- comment_id: uuid (FK)
- mentioned_user_id: uuid (FK)
- created_at: timestamp

### reactions
- id: uuid (PK)
- article_id: uuid (FK)
- user_id: uuid (FK)
- reaction_type: enum ('like', 'love', 'clap', 'wow')
- created_at: timestamp
- UNIQUE(article_id, user_id)

### polls
- id: uuid (PK)
- article_id: uuid (FK)
- creator_id: uuid (FK)
- question: text
- expires_at: timestamp
- is_closed: boolean (default false)
- created_at: timestamp
- updated_at: timestamp

### poll_options
- id: uuid (PK)
- poll_id: uuid (FK)
- option_text: text
- vote_count: int (default 0)
- order: int
- created_at: timestamp

### poll_votes
- id: uuid (PK)
- poll_id: uuid (FK)
- option_id: uuid (FK)
- user_id: uuid (FK)
- created_at: timestamp
- UNIQUE(poll_id, user_id)

### discussions
- id: uuid (PK)
- creator_id: uuid (FK)
- title: text
- content: text
- category: text
- is_pinned: boolean (default false)
- is_featured: boolean (default false)
- view_count: int (default 0)
- reply_count: int (default 0)
- created_at: timestamp
- updated_at: timestamp
- deleted_at: timestamp

### discussion_replies
- id: uuid (PK)
- discussion_id: uuid (FK)
- author_id: uuid (FK)
- parent_reply_id: uuid (FK, NULL if top-level)
- content: text
- like_count: int (default 0)
- is_hidden: boolean (default false)
- created_at: timestamp
- updated_at: timestamp
- deleted_at: timestamp

### badges
- id: uuid (PK)
- name: text UNIQUE
- description: text
- icon: text (emoji or URL)
- criteria: jsonb (rules for earning badge)
- created_at: timestamp

### user_badges
- id: uuid (PK)
- user_id: uuid (FK)
- badge_id: uuid (FK)
- earned_at: timestamp
- UNIQUE(user_id, badge_id)

### reputation_logs
- id: uuid (PK)
- user_id: uuid (FK)
- action: enum ('article_published', 'like_received', 'comment_received', 'share_received', 'follow_received', 'spam', 'fake_news', 'violation')
- points: int
- reason: text
- reference_id: uuid (article_id, comment_id, etc.)
- created_at: timestamp

### notifications
- id: uuid (PK)
- user_id: uuid (FK)
- actor_id: uuid (FK, who triggered the notification)
- type: enum ('follow', 'comment', 'reply', 'reaction', 'mention', 'share', 'poll_vote', 'badge', 'trending', 'featured')
- title: text
- message: text
- reference_id: uuid
- is_read: boolean (default false)
- created_at: timestamp
- read_at: timestamp

### activity_feed
- id: uuid (PK)
- user_id: uuid (FK)
- activity_type: enum ('published', 'commented', 'liked', 'discussed', 'followed', 'badge_earned', 'milestone', 'joined')
- title: text
- description: text
- reference_id: uuid
- metadata: jsonb
- created_at: timestamp

### verification_requests
- id: uuid (PK)
- user_id: uuid (FK)
- status: enum ('pending', 'approved', 'rejected')
- submitted_at: timestamp
- reviewed_at: timestamp
- reviewed_by: uuid (FK to admin user)
- notes: text
- created_at: timestamp
- updated_at: timestamp

### community_reports
- id: uuid (PK)
- reporter_id: uuid (FK)
- report_type: enum ('spam', 'abuse', 'fake_news', 'harassment', 'other')
- content_type: enum ('comment', 'article', 'user', 'discussion')
- content_id: uuid
- reason: text
- status: enum ('pending', 'reviewed', 'resolved', 'dismissed')
- ai_flags: jsonb (AI detection results)
- reviewed_by: uuid (FK, admin)
- action_taken: text
- created_at: timestamp
- updated_at: timestamp

### community_analytics
- id: uuid (PK)
- date: date UNIQUE
- daily_active_users: int
- new_contributors: int
- total_articles_published: int
- total_comments: int
- total_reactions: int
- total_poll_votes: int
- trending_author_id: uuid
- top_article_id: uuid
- created_at: timestamp

## Indexes

- profiles(username)
- profiles(is_verified)
- profiles(suspended_at)
- followers(follower_id, following_id)
- followers(following_id)
- comments(article_id, parent_comment_id)
- comments(author_id)
- reactions(article_id, user_id)
- discussions(creator_id)
- discussions(is_pinned, created_at)
- notifications(user_id, is_read, created_at)
- activity_feed(user_id, created_at)
- verification_requests(status)
- community_reports(status, created_at)

## Row-Level Security (RLS) Policies

### profiles
- Users can read all public profile data
- Users can update only their own profile
- Admins can verify/suspend users

### comments
- Users can read visible comments
- Users can create comments if authenticated
- Users can edit/delete their own comments
- Admins can hide/delete any comments

### followers
- Users can see follower relationships (public)
- Users can follow/unfollow
- Users cannot manipulate others' follow relationships

### reactions
- Users can create/delete their own reactions
- Users can read reaction counts

### notifications
- Users can read only their own notifications
- Users can mark as read

### activity_feed
- Users can read only their own activity feed

