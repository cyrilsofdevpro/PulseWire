/**
 * pages/author/[username].tsx
 * Author Profile Page
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Link2,
  MapPin,
  Check,
  Heart,
  MessageCircle,
  Users,
  BookOpen,
  Eye,
  Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getProfileByUsername, followUser, unfollowUser, isFollowing } from '../../lib/community';
import type { Profile } from '../../types/community';

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

  .author-page {
    min-height: 100vh;
    background: var(--ink);
    color: var(--text-d1);
    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .author-shell {
    max-width: 1000px;
    margin: 0 auto;
  }

  .author-cover {
    height: 240px;
    background: linear-gradient(135deg, rgba(0, 217, 184, .3), rgba(0, 217, 184, .1));
    border: 1px solid var(--border-dark);
    position: relative;
  }

  .author-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .author-header {
    padding: 0 24px;
    margin-bottom: 32px;
  }

  .author-top-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-dark);
    margin-bottom: 24px;
  }

  .author-back-btn {
    background: transparent;
    border: none;
    color: var(--text-d1);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background 0.2s ease;
  }

  .author-back-btn:hover {
    background: var(--ink-raised);
  }

  .author-info {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 24px;
    align-items: start;
    margin-bottom: 32px;
  }

  .author-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: var(--wire);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 800;
    color: #04241f;
    border: 3px solid var(--ink-raised);
    flex-shrink: 0;
    margin-top: -60px;
  }

  .author-meta {
    flex: 1;
  }

  .author-name {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .author-name h1 {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .author-verified {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 217, 184, 0.15);
    border: 1px solid var(--wire);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--wire);
  }

  .author-username {
    color: var(--text-d2);
    font-size: 16px;
    margin-bottom: 12px;
  }

  .author-bio {
    color: var(--text-d2);
    font-size: 15px;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .author-location {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-d3);
    font-size: 14px;
  }

  .author-socials {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .author-social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    color: var(--text-d1);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .author-social-link:hover {
    background: var(--wire);
    color: #04241f;
  }

  .author-actions {
    display: flex;
    gap: 12px;
  }

  .author-btn {
    padding: 12px 20px;
    border-radius: 999px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .author-btn-primary {
    background: var(--wire);
    color: #04241f;
  }

  .author-btn-primary:hover {
    background: var(--wire-dim);
  }

  .author-btn-secondary {
    background: transparent;
    border: 1px solid var(--border-dark);
    color: var(--text-d1);
  }

  .author-btn-secondary:hover {
    background: var(--ink-raised);
  }

  .author-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin-bottom: 40px;
    padding: 24px;
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius);
  }

  .author-stat {
    text-align: center;
  }

  .author-stat strong {
    display: block;
    font-size: 24px;
    color: var(--wire);
    margin-bottom: 4px;
  }

  .author-stat span {
    font-size: 13px;
    color: var(--text-d2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .author-badges {
    margin-bottom: 40px;
  }

  .author-badges h3 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
  }

  .author-badge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .author-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: 12px;
    text-align: center;
    font-size: 12px;
  }

  .author-badge-icon {
    font-size: 28px;
  }

  .author-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .author-section {
    background: var(--ink-raised);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius);
    padding: 24px;
  }

  .author-section h3 {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .author-articles {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .author-article {
    padding: 12px;
    background: var(--ink-raised-2);
    border: 1px solid var(--border-dark);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .author-article:hover {
    border-color: var(--wire);
    background: var(--ink-raised-2);
  }

  .author-article h4 {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 600;
  }

  .author-article p {
    margin: 0;
    font-size: 13px;
    color: var(--text-d2);
    line-height: 1.4;
  }

  .author-expertise {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .author-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--ink-raised-2);
    border: 1px solid var(--border-dark);
    border-radius: 999px;
    font-size: 13px;
    color: var(--text-d2);
  }

  .author-tag.primary {
    background: rgba(0, 217, 184, 0.1);
    border-color: var(--wire);
    color: var(--wire);
  }

  @media (max-width: 768px) {
    .author-info {
      grid-template-columns: 1fr;
    }

    .author-avatar {
      margin-top: -50px;
      width: 100px;
      height: 100px;
      font-size: 40px;
    }

    .author-name h1 {
      font-size: 24px;
    }

    .author-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .author-badge-grid {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }
  }
`;

export default function AuthorPage() {
  const router = useRouter();
  const { username } = router.query;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
      }

      if (!username) return;

      const authorProfile = await getProfileByUsername(username as string);
      setProfile(authorProfile);

      if (authorProfile && data?.user) {
        const following = await isFollowing(data.user.id, authorProfile.id);
        setIsFollowingUser(following);
      }

      setLoading(false);
    }

    load();
  }, [username]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    if (isFollowingUser) {
      await unfollowUser(currentUser.id, profile.id);
    } else {
      await followUser(currentUser.id, profile.id);
    }

    setIsFollowingUser(!isFollowingUser);
  };

  if (loading) {
    return (
      <div className="author-page">
        <style jsx>{styles}</style>
        <div className="author-shell">
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="author-page">
        <style jsx>{styles}</style>
        <div className="author-shell">
          <div style={{ padding: '40px 24px' }}>
            <button className="author-back-btn" onClick={() => router.back()}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <p>Author profile not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="author-page">
      <style jsx>{styles}</style>
      <div className="author-shell">
        <div
          className="author-cover"
          style={{
            backgroundImage: profile.cover_url ? `url(${profile.cover_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className="author-header">
          <div className="author-top-nav">
            <button className="author-back-btn" onClick={() => router.back()}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          <div className="author-info">
            <div
              className="author-avatar"
              style={{
                backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                background: profile.avatar_url
                  ? undefined
                  : 'linear-gradient(135deg, rgba(0, 217, 184, 0.3), rgba(0, 217, 184, 0.1))',
              }}
            >
              {!profile.avatar_url && String(profile.username).slice(0, 2).toUpperCase()}
            </div>

            <div className="author-meta">
              <div className="author-name">
                <h1>{profile.username}</h1>
                {profile.is_verified && (
                  <div className="author-verified">
                    <Check size={14} /> Verified
                  </div>
                )}
              </div>
              <p className="author-username">@{profile.username}</p>
              <p className="author-bio">{profile.bio || 'No bio added yet'}</p>
              {profile.location && (
                <div className="author-location">
                  <MapPin size={14} /> {profile.location}
                </div>
              )}
            </div>

            <div className="author-actions">
              {currentUser?.id !== profile.id && (
                <button
                  className={`author-btn ${isFollowingUser ? 'author-btn-secondary' : 'author-btn-primary'}`}
                  onClick={handleFollow}
                >
                  {isFollowingUser ? 'Following' : 'Follow'}
                </button>
              )}
              <div className="author-socials">
                {profile.social_twitter && (
                  <a
                    href={`https://twitter.com/${profile.social_twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="author-social-link"
                  >
                    <Link2 size={18} />
                  </a>
                )}
                {profile.social_linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profile.social_linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="author-social-link"
                  >
                    <Link2 size={18} />
                  </a>
                )}
                {profile.social_github && (
                  <a
                    href={`https://github.com/${profile.social_github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="author-social-link"
                  >
                    <Link2 size={18} />
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="author-social-link"
                  >
                    <Link2 size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="author-stats">
            <div className="author-stat">
              <strong>{profile.total_followers || 0}</strong>
              <span>
                <Users size={14} /> Followers
              </span>
            </div>
            <div className="author-stat">
              <strong>{profile.total_articles || 0}</strong>
              <span>
                <BookOpen size={14} /> Articles
              </span>
            </div>
            <div className="author-stat">
              <strong>{profile.total_views || 0}</strong>
              <span>
                <Eye size={14} /> Views
              </span>
            </div>
            <div className="author-stat">
              <strong>{profile.reputation_score || 0}</strong>
              <span>
                <Zap size={14} /> Reputation
              </span>
            </div>
          </div>

          {profile.expertise && profile.expertise.length > 0 && (
            <div className="author-badges">
              <h3>Areas of Expertise</h3>
              <div className="author-expertise">
                {profile.expertise.map(topic => (
                  <span key={topic} className="author-tag primary">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
