/**
 * pages/community/discussions.tsx
 * Community Discussions - Chat about news and topics
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Plus,
  Search,
  MessageCircle,
  Heart,
  Eye,
  Pin,
  TrendingUp,
  Zap,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import PulseWireAi from '../../components/PulseWireAi';

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
    --text-l1: #14181F;
    --text-l2: #5C6470;
    --text-l3: #9BA1AB;
    --radius: 20px;
    --shadow: 0 20px 60px -20px rgba(0, 0, 0, .35);
  }

  * {
    box-sizing: border-box;
  }

  .discussions-page {
    min-height: 100vh;
    background: var(--ink);
    color: var(--text-d1);
    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .discussions-shell {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 24px;
    padding: 24px;
  }

  .discussions-main {
    min-width: 0;
  }

  .discussion-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: transparent;
    border: 1px solid var(--border-dark);
    border-radius: 999px;
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

  .discussions-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-dark);
  }

  .discussions-title {
    flex: 1;
  }

  .discussions-title h1 {
    margin: 0 0 4px;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .discussions-title p {
    margin: 0;
    color: var(--text-d2);
    font-size: 14px;
  }

  .discussions-search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: 999px;
    padding: 10px 16px;
    margin-bottom: 24px;
  }

  .discussions-search input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-d1);
    font-size: 14px;
  }

  .discussions-search input::placeholder {
    color: var(--text-d3);
  }

  .discussions-search input:focus {
    outline: none;
  }

  .discussions-new-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--wire);
    color: #04241f;
    border: none;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .discussions-new-btn:hover {
    background: var(--wire-dim);
    transform: translateY(-1px);
  }

  .discussions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .discussion-item {
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius);
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .discussion-item:hover {
    border-color: var(--wire);
    background: var(--ink-raised-2);
  }

  .discussion-item.pinned {
    border-color: var(--gold);
    background: rgba(232, 178, 77, 0.05);
  }

  .discussion-header-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
  }

  .discussion-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--wire);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #04241f;
    font-size: 14px;
    flex-shrink: 0;
  }

  .discussion-header-info {
    flex: 1;
    min-width: 0;
  }

  .discussion-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .discussion-title-text {
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .discussion-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: rgba(232, 178, 77, 0.2);
    border: 1px solid var(--gold);
    border-radius: 4px;
    font-size: 11px;
    color: var(--gold);
    font-weight: 600;
  }

  .discussion-author {
    font-size: 13px;
    color: var(--text-d2);
  }

  .discussion-excerpt {
    font-size: 13px;
    color: var(--text-d2);
    line-height: 1.5;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .discussion-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    color: var(--text-d3);
  }

  .discussion-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .discussions-sidebar {
    min-width: 0;
  }

  .sidebar-card {
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 16px;
  }

  .sidebar-card h3 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sidebar-tag {
    display: inline-flex;
    padding: 6px 10px;
    background: var(--ink-raised-2);
    border: 1px solid var(--border-dark);
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-d2);
    margin: 4px 4px 4px 0;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sidebar-tag:hover {
    border-color: var(--wire);
    color: var(--wire);
  }

  .modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 100;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-overlay.open {
    display: flex;
  }

  .modal-content {
    background: var(--ink);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius);
    padding: 24px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-dark);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .modal-close-btn {
    background: transparent;
    border: none;
    color: var(--text-d1);
    cursor: pointer;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 14px;
  }

  .form-input {
    width: 100%;
    padding: 10px;
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    color: var(--text-d1);
    font-family: inherit;
    font-size: 14px;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--wire);
  }

  .form-textarea {
    width: 100%;
    min-height: 120px;
    padding: 10px;
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    color: var(--text-d1);
    font-family: inherit;
    font-size: 14px;
    resize: none;
  }

  .form-textarea:focus {
    outline: none;
    border-color: var(--wire);
  }

  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .form-btn {
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .form-btn-primary {
    background: var(--wire);
    color: #04241f;
  }

  .form-btn-primary:hover {
    background: var(--wire-dim);
  }

  .form-btn-secondary {
    background: transparent;
    border: 1px solid var(--border-dark);
    color: var(--text-d1);
  }

  .form-btn-secondary:hover {
    background: var(--ink-raised);
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-d2);
  }

  .empty-state p {
    margin: 0;
    font-size: 15px;
  }

  @media (max-width: 900px) {
    .discussions-shell {
      grid-template-columns: 1fr;
    }

    .discussions-sidebar {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .discussions-page {
      padding: 0;
    }

    .discussions-shell {
      padding: 14px;
      gap: 12px;
    }

    .discussions-title h1 {
      font-size: 24px;
    }

    .discussion-item {
      padding: 12px;
    }

    .discussion-header-row {
      flex-direction: column;
    }

    .discussion-avatar {
      width: 36px;
      height: 36px;
      font-size: 12px;
    }

    .modal-content {
      padding: 16px;
    }
  }
`;

const CATEGORIES = [
  'General', 'News', 'Tech', 'Business', 'Politics', 'Science', 'Health', 'Entertainment', 'Sports'
];

interface Discussion {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  ai_summary?: string;
  suggested_tags?: string[];
  category: string;
  is_pinned: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  creator?: { username: string };
}

export default function DiscussionsPage() {
  const router = useRouter();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAiInline, setShowAiInline] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '', category: 'General' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
      }

      await loadDiscussions();
    }

    load();
  }, []);

  async function loadDiscussions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          creator:creator_id(username)
        `)
        .is('deleted_at', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDiscussions(data);
      }
    } catch (err) {
      console.error('Error loading discussions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDiscussion(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !newDiscussion.title.trim()) return;

    setSubmitting(true);
    try {
      const sessionResponse = await supabase?.auth.getSession();
      const token = sessionResponse?.data?.session?.access_token;

      if (!token) {
        console.error('No auth session available');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/community/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newDiscussion.title,
          content: newDiscussion.content,
          category: newDiscussion.category,
        }),
      });

      const payload = await response.json();
      if (response.ok && payload?.data) {
        // Optimistically add the created discussion to the list and navigate to it
        const created = payload.data;
        setDiscussions(prev => [created, ...prev.filter(d => d.id !== created.id)]);
        setNewDiscussion({ title: '', content: '', category: 'General' });
        setShowNewModal(false);
        // Include AI results in query so the detail page can display them immediately
        const qs = `?ai_summary=${encodeURIComponent(created.ai_summary || '')}&tags=${encodeURIComponent(JSON.stringify(created.suggested_tags || []))}`;
        router.push(`/community/discussions/${created.id}${qs}`);
      } else {
        console.error('Discussion creation failed:', payload?.error || payload);
      }
    } catch (err) {
      console.error('Error creating discussion:', err);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredDiscussions = discussions.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="discussions-page">
      <style jsx>{styles}</style>
      <div className="discussions-shell">
        <div className="discussions-main">
          <div className="discussion-nav">
            <button
              className="nav-btn"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/pulsewire');
                }
              }}
            >
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>
          <div className="discussions-header">
            <div className="discussions-title">
              <h1>Community Discussions</h1>
              <p>Chat with the community about news, topics, and more</p>
            </div>
            {currentUser && (
              <button className="discussions-new-btn" onClick={() => setShowNewModal(true)}>
                <Plus size={18} /> Start Discussion
              </button>
            )}
          </div>

          <div className="discussions-search">
            <Search size={18} color="var(--text-d3)" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="discussions-list">
            {loading ? (
              <div className="empty-state">
                <p>Loading discussions...</p>
              </div>
            ) : filteredDiscussions.length === 0 ? (
              <div className="empty-state">
                <p>{searchQuery ? 'No discussions found. Try a different search.' : 'No discussions yet. Start one now!'}</p>
              </div>
            ) : (
              filteredDiscussions.map(discussion => (
                <div
                  key={discussion.id}
                  className={`discussion-item ${discussion.is_pinned ? 'pinned' : ''}`}
                  onClick={() => router.push(`/community/discussions/${discussion.id}`)}
                >
                  <div className="discussion-header-row">
                    <div className="discussion-avatar">
                      {discussion.creator?.username?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="discussion-header-info">
                      <div className="discussion-title-row">
                        <span className="discussion-title-text">{discussion.title}</span>
                        {discussion.is_pinned && (
                          <div className="discussion-badge">
                            <Pin size={10} /> Pinned
                          </div>
                        )}
                      </div>
                      <div className="discussion-author">
                        by {discussion.creator?.username || 'Anonymous'} • {discussion.category}
                      </div>
                    </div>
                  </div>

                  <p className="discussion-excerpt">{discussion.ai_summary || discussion.content}</p>

                  {discussion.suggested_tags && discussion.suggested_tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {discussion.suggested_tags.map((t: string) => (
                        <span key={t} className="discussion-badge" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-d2)', fontSize: 12 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="discussion-meta">
                    <div className="discussion-meta-item">
                      <MessageCircle size={14} />
                      {discussion.reply_count} replies
                    </div>
                    <div className="discussion-meta-item">
                      <Eye size={14} />
                      {discussion.view_count} views
                    </div>
                    <div className="discussion-meta-item">
                      <Heart size={14} />
                      {discussion.like_count} likes
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="discussions-sidebar">
          <div className="sidebar-card">
            <h3>
              <TrendingUp size={16} /> Categories
            </h3>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className="sidebar-tag"
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                style={selectedCategory === cat ? { borderColor: 'var(--wire)', color: 'var(--wire)' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="sidebar-card">
            <h3>
              <Zap size={16} /> Tips
            </h3>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: 1.5, color: 'var(--text-d2)' }}>
              💬 Be respectful and constructive • 📰 Share relevant news • 🔍 Search before posting • ✨ Upvote helpful comments
            </p>
          </div>
        </div>
      </div>

      {/* New Discussion Modal */}
      <div className={`modal-overlay ${showNewModal ? 'open' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Start a New Discussion</h2>
            <button className="modal-close-btn" onClick={() => setShowNewModal(false)}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateDiscussion}>
            <div className="form-group">
              <label className="form-label">Discussion Title</label>
              <input
                className="form-input"
                type="text"
                placeholder="What's the discussion about?"
                value={newDiscussion.title}
                onChange={e => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={newDiscussion.category}
                onChange={e => setNewDiscussion({ ...newDiscussion, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Share your thoughts, news, or question..."
                value={newDiscussion.content}
                onChange={e => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                className="form-btn form-btn-secondary"
                onClick={() => setShowAiInline(s => !s)}
              >
                {showAiInline ? 'Hide PulseWireAI' : 'Ask PulseWireAI'}
              </button>
            </div>

            {showAiInline && (
              <div style={{ marginBottom: 12 }}>
                <PulseWireAi inline defaultPrompt={newDiscussion.content || ''} />
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="form-btn form-btn-secondary"
                onClick={() => setShowNewModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="form-btn form-btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Discussion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
