/**
 * components/CommentThread.tsx
 * Threaded comment system component
 */

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Trash2, Flag, Pin, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getComments, updateComment, deleteComment } from '../lib/community';
import type { Comment } from '../types/community';

const styles = `
  .comment-section {
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius);
    padding: 24px;
    margin: 20px 0;
  }

  .comment-section h3 {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 600;
  }

  .comment-composer {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border-dark);
  }

  .comment-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--wire);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #04241f;
    font-size: 14px;
  }

  .comment-input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .comment-input {
    width: 100%;
    padding: 12px;
    background: var(--ink-raised-2);
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    color: var(--text-d1);
    font-family: inherit;
    font-size: 14px;
    resize: none;
    transition: border-color 0.2s ease;
  }

  .comment-input:focus {
    outline: none;
    border-color: var(--wire);
  }

  .comment-input-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .comment-btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .comment-btn-submit {
    background: var(--wire);
    color: #04241f;
  }

  .comment-btn-submit:hover {
    background: var(--wire-dim);
  }

  .comment-btn-cancel {
    background: transparent;
    border: 1px solid var(--border-dark);
    color: var(--text-d1);
  }

  .comment-btn-cancel:hover {
    background: var(--ink-raised);
  }

  .comment-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .comment-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--ink-raised-2);
    border: 1px solid var(--border-dark);
    border-radius: 8px;
  }

  .comment-item.reply {
    margin-left: 48px;
    margin-top: 8px;
    background: var(--ink-raised-2);
  }

  .comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .comment-author {
    font-weight: 600;
    font-size: 14px;
    color: var(--text-d1);
  }

  .comment-author-title {
    font-size: 12px;
    color: var(--text-d3);
    background: rgba(0, 217, 184, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .comment-time {
    font-size: 12px;
    color: var(--text-d3);
  }

  .comment-content {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-d1);
    margin: 8px 0;
  }

  .comment-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 8px;
  }

  .comment-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: none;
    color: var(--text-d3);
    cursor: pointer;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .comment-action-btn:hover {
    color: var(--wire);
    background: rgba(0, 217, 184, 0.1);
  }

  .comment-menu {
    display: flex;
    gap: 4px;
  }

  .comment-menu-btn {
    background: transparent;
    border: none;
    color: var(--text-d3);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .comment-menu-btn:hover {
    color: var(--text-d1);
  }

  .comment-replies {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .comment-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-d2);
  }

  .mention-input {
    position: relative;
  }

  .mention-popup {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    margin-bottom: 4px;
  }

  .mention-item {
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.2s ease;
    font-size: 13px;
  }

  .mention-item:hover {
    background: var(--ink-raised-2);
  }
`;

interface CommentThreadProps {
  articleId: string;
  currentUserId?: string;
  isAuthenticated: boolean;
}

export default function CommentThread({ articleId, currentUserId, isAuthenticated }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadComments();
  }, [articleId]);

  async function loadComments() {
    setLoading(true);
    const data = await getComments(articleId);
    setComments(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          content: newComment,
        }),
      });

      if (response.ok) {
        setNewComment('');
        await loadComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string, newContent: string) {
    try {
      await updateComment(commentId, newContent);
      setEditingId(null);
      await loadComments();
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  return (
    <div className="comment-section">
      <style jsx>{styles}</style>
      <h3>Comments ({comments.length})</h3>

      {isAuthenticated && (
        <div className="comment-composer">
          <div className="comment-avatar">
            {currentUserId ? String(currentUserId).slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="comment-input-wrapper">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                className="comment-input"
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="comment-input-actions">
                {newComment.trim() && (
                  <>
                    <button
                      type="button"
                      className="comment-btn comment-btn-cancel"
                      onClick={() => setNewComment('')}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="comment-btn comment-btn-submit" disabled={submitting}>
                      {submitting ? 'Posting...' : 'Post comment'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="comment-list">
        {loading ? (
          <div className="comment-empty">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="comment-empty">No comments yet. Be the first to share your thoughts!</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar" style={{ marginTop: '4px' }}>
                {comment.author?.username?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="comment-header">
                  <span className="comment-author">{comment.author?.username || 'Anonymous'}</span>
                  {comment.is_pinned && <span style={{ color: 'var(--wire)', fontSize: '12px' }}>📌 Pinned</span>}
                  <span className="comment-time">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>

                {editingId === comment.id ? (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <textarea
                      className="comment-input"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={2}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="comment-btn comment-btn-submit"
                        onClick={() => handleEdit(comment.id, editText)}
                      >
                        Save
                      </button>
                      <button
                        className="comment-btn comment-btn-cancel"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="comment-content">{comment.content}</p>
                    <div className="comment-actions">
                      <button className="comment-action-btn">
                        <Heart size={14} /> Like
                      </button>
                      <button className="comment-action-btn">
                        <MessageCircle size={14} /> Reply
                      </button>
                      {currentUserId === comment.author_id && (
                        <>
                          <button
                            className="comment-action-btn"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditText(comment.content);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="comment-action-btn"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      {currentUserId !== comment.author_id && (
                        <button className="comment-action-btn">
                          <Flag size={14} /> Report
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
