import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Compass, Sparkles, TrendingUp, Search } from 'lucide-react';

const styles = `
  :root { --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
  * { box-sizing:border-box; }
  .pw-discover-page { min-height:100vh; background:var(--ink); color:var(--text-d1); font-family:Inter,sans-serif; padding:22px; }
  .pw-discover-shell { max-width: 1080px; margin: 0 auto; }
  .pw-discover-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .pw-discover-title { font-size: 30px; margin: 0; }
  .pw-back-btn, .pw-link-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; border:1px solid var(--border-dark); background:transparent; color:var(--text-d1); cursor:pointer; }
  .pw-link-btn { background:var(--wire); color:#04241f; border:none; font-weight:700; }
  .pw-discover-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:16px; margin-top:16px; }
  .pw-discover-card { background:var(--ink-raised); border:1px solid var(--border-dark); border-radius:var(--radius); padding:18px; }
  .pw-discover-card h3 { margin: 0 0 8px; }
  .pw-discover-card p { margin:0; color:var(--text-d2); line-height:1.6; }
  .pw-discover-tag { display:inline-flex; align-items:center; gap:7px; font-size:11px; text-transform:uppercase; color:var(--wire); font-weight:700; letter-spacing:.08em; margin-bottom: 10px; }
  .pw-discover-news-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:14px; margin-top:16px; }
  .pw-discover-news-card { border-radius:20px; overflow:hidden; background:var(--ink); border:1px solid var(--border); }
  .pw-discover-news-image { min-height:160px; background-size:cover; background-position:center; }
  .pw-discover-news-body { padding:16px; }
  .pw-discover-news-body h3 { margin:0 0 10px; font-size:18px; }
  .pw-discover-news-body p { margin:0; color:var(--text-d2); line-height:1.6; }
  .pw-discover-news-footer { margin-top:12px; display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; }
  @media (max-width: 900px) { .pw-discover-grid, .pw-discover-news-grid { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .pw-discover-page { padding: 14px; } .pw-discover-title { font-size: 24px; } }
`;

type NewsItem = {
  id: string
  title: string
  category: string
  summary: string
  url: string
  image: string
}

const cards = [
  { title: 'Latest stories', body: 'Browse fresh politics, business, technology, health, and world coverage across the newsroom.', icon: Compass },
  { title: 'Trending topics', body: 'See what readers are following right now and jump into the most active conversations.', icon: TrendingUp },
  { title: 'PulseWireAI', body: 'Open the full AI workspace for summaries, Q&A, translation, and smart editorial assistance.', icon: Sparkles },
  { title: 'Newsroom', body: 'Open the full newsroom and browse all imported stories enriched with AI summaries and metadata.', icon: Compass },
];

export default function DiscoverPage() {
  const router = useRouter();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    async function loadNews() {
      setLoadingNews(true);
      try {
        const response = await fetch('/api/news/stored');
        const payload = await response.json();
        if (response.ok && Array.isArray(payload.articles)) {
          const items = payload.articles.slice(0, 4).map((article: any) => ({
            id: article.id || String(article.url),
            title: article.title || 'PulseWire story',
            category: article.category || 'World News',
            summary: article.summary || article.description || String(article.content || '').slice(0, 120),
            url: article.url || '#',
            image: article.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=80',
          }))
          setNewsItems(items)
        }
      } catch (error) {
        console.warn('Unable to load discover news:', error)
      } finally {
        setLoadingNews(false)
      }
    }

    loadNews()
  }, [])

  return (
    <div className="pw-discover-page">
      <style jsx>{styles}</style>
      <div className="pw-discover-shell">
        <div className="pw-discover-header">
          <div>
            <div className="pw-discover-tag"><Compass size={13} /> Discover</div>
            <h1 className="pw-discover-title">Explore the newsroom</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="pw-back-btn" onClick={() => router.push('/dashboard')}><ArrowLeft size={16} /> Back to dashboard</button>
            <button className="pw-link-btn" onClick={() => router.push('/ai')}><Sparkles size={16} /> Open PulseWireAI</button>
          </div>
        </div>

        <div className="pw-discover-grid">
          {cards.map((card, index) => {
            const Icon = card.icon
            return (
              <section key={index} className="pw-discover-card">
                <div className="pw-discover-tag"><Icon size={13} /> {card.title}</div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </section>
            )
          })}
        </div>

        <section className="pw-discover-card" style={{ marginTop: 16 }}>
          <div className="pw-discover-tag"><Search size={13} /> Smart search</div>
          <p>Use the main app feed, alerts screen, and AI workspace together to move from discovery to reading to analysis in a single flow.</p>
        </section>

        <section className="pw-discover-card" style={{ marginTop: 16 }}>
          <div className="pw-discover-tag"><Compass size={13} /> From the newsroom</div>
          {loadingNews ? (
            <p>Loading the latest PulseWire stories…</p>
          ) : newsItems.length ? (
            <div className="pw-discover-news-grid">
              {newsItems.map((item) => (
                <article key={item.id} className="pw-discover-news-card">
                  <div className="pw-discover-news-image" style={{ backgroundImage: `url(${item.image})` }} />
                  <div className="pw-discover-news-body">
                    <span className="pw-discover-tag">{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <div className="pw-discover-news-footer">
                      <button className="pw-link-btn" onClick={() => window.open(item.url, '_blank')}>Read story</button>
                      <button className="pw-link-btn" style={{ background: 'transparent', color: 'var(--text-d1)', borderColor: 'var(--border)' }} onClick={() => router.push('/news')}>Open newsroom</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>No recent newsroom stories are available yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
