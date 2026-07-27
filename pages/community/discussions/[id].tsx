/**
 * pages/community/discussions/[id].tsx
 * Discussion Detail Page - View and reply to discussions
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Eye,
  Pin,
  Trash2,
  Flag,
  Share2,
  Edit2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const styles = `
  :root {
    --ink: #0B0F14;
    --ink-raised: #131924;
    --ink-raised-2: #1A2230;
    --paper: #F7F5F0;
    --paper-raised: #FFFFFF;
    --paper-raised-2: #EFEDE6;
    --wire: #00D9B8;
    --wire-dim: #00A896;
    --alert: #FF3B30;
    --gold: #E8B24D;
    --border-dark: rgba(255, 255, 255, .08);
    --border-light: rgba(20, 24, 31, .09);
    --text-d1: #F3F4F1;
    --text-d2: #9BA3AF;
    --text-d3: #5C6673;
    --radius: 20px;
    --shadow: 0 20px 60px -20px rgba(0, 0, 0, .35);
  }

  * {
    box-sizing: border-box;
  }

  .discussion-page {
    min-height: 100vh;
    background: var(--ink);
    color: var(--text-d1);
    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 24px;
  }

  .discussion-shell {
    max-width: 800px;
    margin: 0 auto;
  }

  .discussion-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: transparent;
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    color: var(--text-d1);
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s ease;
  }

  .nav-btn:hover {
    border-color: var(--wire);
    background: var(--ink-raised);
  }

  .discussion-detail {
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 24px;
  }

  .discussion-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .discussion-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--wire);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #04241f;
    font-size: 16px;
    flex-shrink: 0;
  }

  .discussion-meta-info {
    flex: 1;
  }

  .discussion-author-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .discussion-author-name {
    font-weight: 600;
    font-size: 15px;
  }

  .discussion-time {
    font-size: 12px;
    color: var(--text-d3);
  }

  .discussion-category-badge {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(0, 217, 184, 0.1);
    border: 1px solid var(--wire);
    border-radius: 20px;
    font-size: 11px;
    color: var(--wire);
    font-weight: 600;
  }

  .discussion-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    color: var(--text-d3);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    border-color: var(--wire);
    color: var(--wire);
    background: rgba(0, 217, 184, 0.1);
  }

  .discussion-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 12px;
    line-height: 1.3;
  }

  .discussion-content {
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-d1);
    margin: 0 0 16px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .discussion-ai-summary {
    font-size: 14px;
    color: var(--text-d2);
    margin: 0 0 12px;
  }

  .discussion-stats {
    display: flex;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-dark);
    font-size: 13px;
    color: var(--text-d2);
  }

  .discussion-tags {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .replies-section {
    margin-top: 24px;
  }

  .replies-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-dark);
  }

  .replies-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .reply-composer {
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 16px;
  }

  .composer-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .composer-input {
    width: 100%;
    min-height: 100px;
    padding: 12px;
    background: var(--ink-raised-2);
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    color: var(--text-d1);
    font-family: inherit;
    font-size: 14px;
    resize: none;
  }

  .composer-input:focus {
    outline: none;
    border-color: var(--wire);
  }

  .composer-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .composer-btn {
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .composer-btn-submit {
    background: var(--wire);
    color: #04241f;
  }

  .composer-btn-submit:hover {
    background: var(--wire-dim);
  }

  .composer-btn-cancel {
    background: transparent;
    border: 1px solid var(--border-dark);
    color: var(--text-d1);
  }

  .composer-btn-cancel:hover {
    background: var(--ink-raised);
  }

  .replies-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .reply-item {
    background: var(--ink-raised-2);
    border: 1px solid var(--border-dark);
    border-radius: 12px;
    padding: 16px;
  }

  .reply-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  .reply-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--wire);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #04241f;
    font-size: 12px;
    flex-shrink: 0;
  }

  .reply-meta {
    flex: 1;
  }

  .reply-author {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 2px;
  }

  .reply-time {
    font-size: 11px;
    color: var(--text-d3);
  }

  .reply-content {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-d1);
    margin: 0 0 12px 48px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .reply-actions {
    display: flex;
    gap: 8px;
    margin-left: 48px;
    font-size: 12px;
  }

  .reply-action {
    background: transparent;
    border: none;
    color: var(--text-d3);
    cursor: pointer;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .reply-action:hover {
    background: rgba(0, 217, 184, 0.1);
    color: var(--wire);
  }

  .empty-replies {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-d2);
    font-size: 14px;
  }

  @media (max-width: 640px) {
    .discussion-page {
      padding: 14px;
    }

    .discussion-detail {
      padding: 16px;
    }

    .discussion-title {
      font-size: 20px;
    }

    .reply-content {
      margin-left: 0;
    }

    .reply-actions {
      margin-left: 0;
    }
  }
`;

interface Discussion {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  ai_summary?: string;
  suggested_tags?: string[];
  category: string;
  view_count: number;
  reply_count: number;
  like_count: number;
  created_at: string;
  creator?: { username: string };
}

interface Reply {
  id: string;
  author_id: string;
  content: string;
  like_count: number;
  created_at: string;
  author?: { username: string };
}

export default function DiscussionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const discussionId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
      }

      if (!discussionId) return;
      await loadDiscussion();
    }

    if (discussionId) {
      load();
    }
  }, [discussionId]);

  async function loadDiscussion() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          creator:creator_id(username)
        `)
.eq('id', discussionId)
        .single();

      if (!error && data) {
        // Merge any AI summary/tags passed via query params (from immediate creation)
        let aiSummary: string | undefined;
        let suggestedTags: string[] | undefined;
        try {
          if (typeof router.query.ai_summary === 'string' && router.query.ai_summary.length > 0) {
            aiSummary = decodeURIComponent(String(router.query.ai_summary));
          }
          if (typeof router.query.tags === 'string' && router.query.tags.length > 0) {
            suggestedTags = JSON.parse(decodeURIComponent(String(router.query.tags)));
          }
        } catch (e) {
          // ignore parse errors
        }

        const merged = { ...(data || {}), ...(aiSummary ? { ai_summary: aiSummary } : {}), ...(suggestedTags ? { suggested_tags: suggestedTags } : {}) };
        setDiscussion(merged as any);

        // Increment view count
        await supabase
          .from('discussions')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', discussionId);

        // Load replies
        const { data: repliesData } = await supabase
          .from('discussion_replies')
          .select(`
            *,
            author:author_id(username)
          `)
          .eq('discussion_id', discussionId)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (repliesData) {
          setReplies(repliesData);
        }
      }
    } catch (err) {
      console.error('Error loading discussion:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const sessionResponse = await supabase?.auth.getSession();
      const token = sessionResponse?.data?.session?.access_token;

      if (!token) {
        console.error('No auth session available');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/community/discussion-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          discussion_id: discussionId,
          content: replyText,
        }),
      });

      const payload = await response.json();
      if (response.ok && payload?.data) {
        setReplyText('');
        await loadDiscussion();
      } else {
        console.error('Reply submission failed:', payload?.error || payload);
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="discussion-page">
        <style jsx>{styles}</style>
        <div className="discussion-shell">
          <p>Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="discussion-page">
        <style jsx>{styles}</style>
        <div className="discussion-shell">
          <button className="nav-btn" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back
          </button>
          <p>Discussion not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="discussion-page">
      <style jsx>{styles}</style>
      <div className="discussion-shell">
        <div className="discussion-nav">
          <button
            className="nav-btn"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/community/discussions');
              }
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>

        {/* Discussion Detail */}
        <div className="discussion-detail">
          <div className="discussion-top">
            <div className="discussion-avatar">
              {discussion.creator?.username?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="discussion-meta-info">
              <div className="discussion-author-info">
                <span className="discussion-author-name">{discussion.creator?.username || 'Anonymous'}</span>
                <span className="discussion-time">
                  {new Date(discussion.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="discussion-category-badge">{discussion.category}</span>
              </div>
            </div>
            <div className="discussion-actions">
              <button className="action-btn" title="Like">
                <Heart size={16} />
              </button>
              <button className="action-btn" title="Flag">
                <Flag size={16} />
              </button>
              <button className="action-btn" title="Share">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <h1 className="discussion-title">{discussion.title}</h1>
          {discussion.ai_summary && <p className="discussion-ai-summary">{discussion.ai_summary}</p>}
          <p className="discussion-content">{discussion.content}</p>

          {discussion.suggested_tags && discussion.suggested_tags.length > 0 && (
            <div className="discussion-tags">
              {discussion.suggested_tags.map((t: string) => (
                <span key={t} className="discussion-badge" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-d2)', fontSize: 12 }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="discussion-stats">
            <div className="stat-item">
              <Eye size={14} /> {discussion.view_count} views
            </div>
            <div className="stat-item">
              <MessageCircle size={14} /> {discussion.reply_count} replies
            </div>
            <div className="stat-item">
              <Heart size={14} /> {discussion.like_count} likes
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="replies-section">
          <div className="replies-header">
            <h3>Replies ({replies.length})</h3>
          </div>

          {currentUser && (
            <div className="reply-composer">
              <form onSubmit={handleSubmitReply} className="composer-form">
                <textarea
                  className="composer-input"
                  placeholder="Share your thoughts..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  required
                />
                <div className="composer-actions">
                  {replyText.trim() && (
                    <>
                      <button
                        type="button"
                        className="composer-btn composer-btn-cancel"
                        onClick={() => setReplyText('')}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="composer-btn composer-btn-submit"
                        disabled={submitting}
                      >
                        {submitting ? 'Posting...' : 'Post Reply'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className="replies-list">
            {replies.length === 0 ? (
              <div className="empty-replies">
                <p>No replies yet. Be the first to respond!</p>
              </div>
            ) : (
              replies.map(reply => (
                <div key={reply.id} className="reply-item">
                  <div className="reply-top">
                    <div className="reply-avatar">
                      {reply.author?.username?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="reply-meta">
                      <div className="reply-author">{reply.author?.username || 'Anonymous'}</div>
                      <div className="reply-time">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <p className="reply-content">{reply.content}</p>

                  <div className="reply-actions">
                    <button className="reply-action">
                      <Heart size={12} /> Like ({reply.like_count})
                    </button>
                    {currentUser?.id === reply.author_id && (
                      <>
                        <button className="reply-action">
                          <Edit2 size={12} /> Edit
                        </button>
                        <button className="reply-action">
                          <Trash2 size={12} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
