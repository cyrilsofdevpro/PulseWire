/**
 * components/ReactionBar.tsx
 * Article reactions component
 */

import React, { useState, useEffect } from 'react';
import { ThumbsUp, Heart, Zap, Smile } from 'lucide-react';
import type { ReactionType } from '../types/community';

const styles = `
  .reaction-bar {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 12px;
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: 12px;
    flex-wrap: wrap;
  }

  .reaction-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--border-dark);
    background: transparent;
    color: var(--text-d2);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .reaction-btn:hover {
    border-color: var(--wire);
    color: var(--wire);
    background: rgba(0, 217, 184, 0.08);
  }

  .reaction-btn.active {
    background: rgba(0, 217, 184, 0.2);
    border-color: var(--wire);
    color: var(--wire);
  }

  .reaction-count {
    font-size: 12px;
    min-width: 16px;
  }

  .reaction-divider {
    width: 1px;
    height: 24px;
    background: var(--border-dark);
    margin: 0 4px;
  }
`;

interface ReactionBarProps {
  articleId: string;
  isAuthenticated: boolean;
  onReactionChange?: (reactions: Record<ReactionType, number>) => void;
}

const REACTIONS: { type: ReactionType; icon: React.ReactNode; label: string; emoji: string }[] = [
  { type: 'like', icon: <ThumbsUp size={14} />, label: 'Like', emoji: '👍' },
  { type: 'love', icon: <Heart size={14} />, label: 'Love', emoji: '❤️' },
  { type: 'clap', icon: <Zap size={14} />, label: 'Clap', emoji: '👏' },
  { type: 'wow', icon: <Smile size={14} />, label: 'Wow', emoji: '😮' },
];

export default function ReactionBar({ articleId, isAuthenticated, onReactionChange }: ReactionBarProps) {
  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    clap: 0,
    wow: 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [articleId]);

  async function loadReactions() {
    try {
      const response = await fetch(`/api/community/reactions?article_id=${articleId}`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.data || { like: 0, love: 0, clap: 0, wow: 0 });
        setUserReaction(data.userReaction || null);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  }

  async function handleReaction(type: ReactionType) {
    if (!isAuthenticated) {
      alert('Please log in to react');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/community/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          reaction_type: type,
        }),
      });

      if (response.ok) {
        setUserReaction(type);

        // Update local state optimistically
        const newReactions = { ...reactions };
        if (userReaction && userReaction !== type) {
          newReactions[userReaction]--;
        } else if (userReaction === type) {
          newReactions[type]--;
          setUserReaction(null);
          setLoading(false);
          return;
        }
        newReactions[type]++;
        setReactions(newReactions);
        onReactionChange?.(newReactions);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setLoading(false);
    }
  }

  const total = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <div className="reaction-bar">
      <style jsx>{styles}</style>

      {REACTIONS.map(reaction => (
        <button
          key={reaction.type}
          className={`reaction-btn ${userReaction === reaction.type ? 'active' : ''}`}
          onClick={() => handleReaction(reaction.type)}
          disabled={loading}
          title={reaction.label}
        >
          {reaction.icon}
          <span className="reaction-count">{reactions[reaction.type] > 0 ? reactions[reaction.type] : ''}</span>
        </button>
      ))}

      {total > 0 && (
        <>
          <div className="reaction-divider" />
          <span style={{ fontSize: '13px', color: 'var(--text-d2)' }}>
            {total} {total === 1 ? 'reaction' : 'reactions'}
          </span>
        </>
      )}
    </div>
  );
}
