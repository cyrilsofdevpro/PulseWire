import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, Sparkles, User, Settings, Newspaper, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getFollowCounts } from '../lib/follows';
import { usePremiumAccess } from '../hooks/usePremiumAccess';

const styles = `
  :root { --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
  * { box-sizing: border-box; }
  body { margin: 0; }
  .pw-dashboard { min-height: 100vh; background: radial-gradient(circle at top, rgba(0, 217, 184, .12), transparent 32%), var(--ink); color: var(--text-d1); font-family: Inter, sans-serif; padding: 24px; }
  .pw-dashboard-shell { max-width: 1080px; margin: 0 auto; }
  .pw-dashboard-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
  .pw-dashboard-title { margin:0; font-size:30px; letter-spacing:-.03em; }
  .pw-dashboard-sub { margin:8px 0 0; color: var(--text-d2); }
  .pw-dashboard-grid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:16px; }
  .pw-dashboard-card { background: var(--ink-raised); border:1px solid var(--border-dark); border-radius: var(--radius); padding:18px; box-shadow: var(--shadow); }
  .pw-dashboard-card h3 { margin: 0 0 8px; font-size: 16px; }
  .pw-dashboard-card p { margin: 0; color: var(--text-d2); line-height: 1.6; }
  .pw-dashboard-stat { font-size: 28px; font-weight: 800; color: var(--wire); margin-bottom: 6px; }
  .pw-dashboard-actions { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; margin-top:16px; }
  .pw-btn { border:none; border-radius:999px; padding:12px 16px; font-weight: 700; cursor:pointer; }
  .pw-btn-primary { background: var(--wire); color:#04241f; }
  .pw-btn-secondary { background: transparent; border:1px solid var(--border-dark); color: var(--text-d1); }
  .pw-chip { display:inline-flex; align-items:center; gap:8px; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color: var(--wire); font-weight:700; margin-bottom: 8px; }
  @media (max-width: 900px) { .pw-dashboard-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 640px) { .pw-dashboard { padding: 14px; } .pw-dashboard-grid, .pw-dashboard-actions { grid-template-columns: 1fr; } .pw-dashboard-title { font-size: 26px; } }
`;

export default function DashboardPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('PulseWire member');
  const [newsAlerts, setNewsAlerts] = useState(12);
  const [savedReads, setSavedReads] = useState(4);
  const [aiActions, setAiActions] = useState(2);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestMessage, setIngestMessage] = useState('');
  const { plan, loading: premiumLoading, isPro } = usePremiumAccess();

  useEffect(() => {
    async function loadUser() {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Dashboard auth error', error.message);
        return;
      }

      const user = data?.user;
      if (!user) {
        setDisplayName('Guest');
        setNewsAlerts(0);
        setSavedReads(0);
        setAiActions(0);
        setFollowers(0);
        setFollowing(0);
        return;
      }

      const metadata = (user.user_metadata || {}) as any;
      const name = metadata.username || metadata.full_name || metadata.name || user.email || 'PulseWire member';
      setDisplayName(String(name));

      // Use stored news articles count for News alerts
      try {
        const feedResponse = await fetch('/api/news/stored')
        const feedData = await feedResponse.json()
        const feedCount = Array.isArray(feedData.articles) ? feedData.articles.length : 0
        setNewsAlerts(feedCount)
      } catch (e) {
        console.warn('Failed to load stored news count:', e)
        setNewsAlerts(0)
      }

      if (user.email) {
        const postResponse = await fetch(`/api/posts?authorEmail=${encodeURIComponent(user.email)}`);
        const postData = await postResponse.json();
        const postCount = Array.isArray(postData.posts) ? postData.posts.length : 0;
        setSavedReads(postCount);
        setAiActions(Math.max(1, Math.min(postCount + 1, 6)));
      }

      const counts = await getFollowCounts(user.id);
      setFollowers(counts.followers);
      setFollowing(counts.following);
    }

    loadUser();
  }, []);

  async function handleFetchLatestNews() {
    if (!isPro) {
      router.push('/pricing');
      return;
    }

    setIngestLoading(true);
    setIngestMessage('Fetching latest PulseWire Pro stories from NewsData...');

    try {
      const response = await fetch('/api/news/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'us' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to ingest news');
      }

      setIngestMessage(`Imported ${data.imported || 0} new stories. Scanned ${data.scanned || 0} articles. ${data.duplicates || 0} duplicates were skipped.`);
    } catch (error: any) {
      setIngestMessage(error?.message || 'News import failed.');
    } finally {
      setIngestLoading(false);
    }
  }

  return (
    <div className="pw-dashboard">
      <style jsx>{styles}</style>
      <div className="pw-dashboard-shell">
        <div className="pw-dashboard-top">
          <div>
            <div className="pw-chip"><Sparkles size={14} /> PulseWire dashboard</div>
            <h1 className="pw-dashboard-title">Welcome back, {displayName}</h1>
            <p className="pw-dashboard-sub">Your newsroom hub for latest updates, alerts, AI tools, and profile management.</p>
          </div>
        </div>

        <div className="pw-dashboard-grid">
          <section className="pw-dashboard-card">
            <div className="pw-dashboard-stat">{newsAlerts}</div>
            <h3>News alerts</h3>
            <p>Fresh top stories and trending updates available in your feed.</p>
          </section>
          <section className="pw-dashboard-card">
            <div className="pw-dashboard-stat">{savedReads}</div>
            <h3>Saved reads</h3>
            <p>Stories you have saved for later review and follow-up.</p>
          </section>
          <section className="pw-dashboard-card">
            <div className="pw-dashboard-stat">{aiActions}</div>
            <h3>AI actions</h3>
            <p>Ask, summarize, translate, or draft directly from the app.</p>
          </section>
          <section className="pw-dashboard-card">
            <div className="pw-dashboard-stat">{premiumLoading ? '…' : plan === 'pro' ? 'PulseWire Pro' : plan === 'enterprise' ? 'Enterprise' : 'Free'}</div>
            <h3>Subscription</h3>
            <p>{premiumLoading ? 'Checking plan…' : isPro ? 'PulseWire Pro users can auto-import news via the pipeline.' : 'Upgrade to PulseWire Pro to unlock premium news ingestion.'}</p>
          </section>
        </div>

        <div className="pw-dashboard-actions">
          <button className="pw-btn pw-btn-primary" onClick={() => router.push('/pulsewire')}>Go to feed <ArrowRight size={16} /></button>
          <button className="pw-btn pw-btn-secondary" onClick={() => router.push('/alerts')}>Open alerts</button>
          <button className="pw-btn pw-btn-secondary" onClick={() => router.push('/profile')}><User size={16} /> My profile</button>
          <button className="pw-btn pw-btn-secondary" onClick={() => router.push('/settings')}><Settings size={16} /> Settings</button>
          <button className="pw-btn pw-btn-secondary" onClick={() => router.push('/ai')}><Sparkles size={16} /> PulseWireAI</button>
          <button
            className={`pw-btn ${isPro ? 'pw-btn-primary' : 'pw-btn-secondary'}`}
            onClick={handleFetchLatestNews}
            disabled={ingestLoading || premiumLoading}
          >
            {isPro ? 'Fetch latest Pro news' : 'Upgrade to PulseWire Pro'}
          </button>
        </div>
        {(ingestMessage || premiumLoading) && (
          <section className="pw-dashboard-card" style={{ marginTop: '16px' }}>
            <p>{premiumLoading ? 'Verifying subscription...' : ingestMessage}</p>
          </section>
        )}
      </div>
    </div>
  );
}
