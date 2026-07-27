import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, User, Users, Newspaper, Globe, Check, Star } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getFollowCounts } from '../lib/follows';

const styles = `
  :root { --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
  * { box-sizing: border-box; }
  .pw-profile-page { min-height:100vh; background:var(--ink); color:var(--text-d1); font-family:Inter,sans-serif; padding:22px; }
  .pw-profile-shell { max-width: 960px; margin: 0 auto; }
  .pw-profile-hero { background: linear-gradient(135deg, rgba(0, 217, 184, .35), rgba(0, 217, 184, .08)); border:1px solid var(--border-dark); border-radius: var(--radius); padding:24px; display:flex; align-items:center; gap:16px; margin-bottom:16px; }
  .pw-profile-avatar { width: 72px; height: 72px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size: 24px; font-weight:800; background: var(--wire); color:#04241f; }
  .pw-profile-meta { flex:1; }
  .pw-profile-name { margin:0 0 4px; font-size: 28px; }
  .pw-profile-bio { margin:0; color:var(--text-d2); }
  .pw-profile-stats { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; margin-bottom:16px; }
  .pw-profile-stat { background: var(--ink-raised); border:1px solid var(--border-dark); border-radius: var(--radius); padding:18px; }
  .pw-profile-stat strong { display:block; font-size:24px; color:var(--wire); margin-bottom:4px; }
  .pw-profile-stat span { color: var(--text-d2); font-size: 13px; }
  .pw-profile-card { background: var(--ink-raised); border:1px solid var(--border-dark); border-radius: var(--radius); padding:18px; margin-bottom: 16px; }
  .pw-profile-card h3 { margin:0 0 10px; }
  .pw-profile-card p { margin:0; color: var(--text-d2); line-height:1.6; }
  .pw-top-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; border:1px solid var(--border-dark); background:transparent; color:var(--text-d1); cursor:pointer; margin-bottom: 16px; }
  @media (max-width: 640px) { .pw-profile-page { padding: 14px; } .pw-profile-hero { flex-direction: column; align-items:flex-start; } .pw-profile-stats { grid-template-columns: 1fr 1fr; } }
`;

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('PulseWire member');
  const [email, setEmail] = useState('');
  const [posts, setPosts] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [bio, setBio] = useState('Your live profile details will show here after login.');
  const [verificationBadge, setVerificationBadge] = useState(false);
  const [badges, setBadges] = useState<Array<{ name: string; icon?: string; description?: string }>>([])
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Profile auth error', error.message);
        router.push('/login');
        return;
      }

      const user = data?.user;
      if (!user) {
        router.push('/login');
        return;
      }

      const metadata = (user.user_metadata || {}) as any;
      setName(metadata.username || metadata.full_name || metadata.name || user.email || 'PulseWire member');
      setEmail(user.email || '');
      setBio(metadata.bio || 'Publishing ideas, stories, and community updates on PulseWire.');

      // try to load profile record to detect verification badge and badges
      try {
        const { data: profile } = await supabase.from('profiles').select('verification_badge').eq('id', user.id).maybeSingle()
        if (profile && profile.verification_badge) setVerificationBadge(true)

        const { data: ub } = await supabase.from('user_badges').select('badges(name,icon,description)').eq('user_id', user.id)
        if (Array.isArray(ub)) {
          setBadges(ub.map((u: any) => u.badges).filter(Boolean))
        }
      } catch (err) {
        // ignore
      }
      const postResponse = await fetch(`/api/posts?authorEmail=${encodeURIComponent(user.email || '')}`);
      const postData = await postResponse.json();
      const postCount = Array.isArray(postData.posts) ? postData.posts.length : 0;
      setPosts(postCount);

      const counts = await getFollowCounts(user.id);
      setFollowers(counts.followers);
      setFollowing(counts.following);
    }

    load();
  }, [router]);

  return (
    <div className="pw-profile-page">
      <style jsx>{styles}</style>
      <div className="pw-profile-shell">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button className="pw-top-btn" onClick={() => router.push('/dashboard')}><ArrowLeft size={16} /> Back to dashboard</button>
          <button className="pw-top-btn" onClick={() => router.push('/settings')} style={{ color: 'var(--wire)', borderColor: 'var(--wire)' }}><Globe size={16} /> Settings</button>
        </div>

        <section className="pw-profile-hero">
          <div className="pw-profile-avatar">{String(name).slice(0, 2).toUpperCase()}</div>
          <div className="pw-profile-meta">
            <h1 className="pw-profile-name">
              {name} {verificationBadge && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8, color: 'var(--gold)', fontSize: 14 }}><Star size={16} />Trusted</span>}
            </h1>
            <p className="pw-profile-bio">{bio}</p>
            <p className="pw-profile-bio" style={{ marginTop: 8 }}>{email}</p>
          </div>
        </section>

        {badges.length > 0 && (
          <section className="pw-profile-card">
            <h3>Badges</h3>
            <div style={{ marginTop: 8 }}>
              {/* Lazy inline rendering to avoid extra imports */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {badges.map(b => (
                  <div key={b.name} title={b.description} style={{ padding: '8px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{b.icon || '★'}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: 13 }}>{b.name}</strong>
                      <small style={{ color: 'var(--text-d2)' }}>{b.description}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="pw-profile-stats">
          <div className="pw-profile-stat">
            <strong>{posts}</strong>
            <span><Newspaper size={13} /> News posts</span>
          </div>
          <div className="pw-profile-stat">
            <strong>{followers}</strong>
            <span><Users size={13} /> Followers</span>
          </div>
          <div className="pw-profile-stat">
            <strong>{following}</strong>
            <span><User size={13} /> Following</span>
          </div>
          <div className="pw-profile-stat">
            <strong>Live</strong>
            <span><Globe size={13} /> Account status</span>
          </div>
        </section>

        <section className="pw-profile-card">
          <h3>Profile summary</h3>
          <p>{name} is actively publishing stories and using PulseWireAI to keep the feed moving fast. The profile now reflects live account data, post count, and follow activity.</p>
        </section>
      </div>
    </div>
  );
}
