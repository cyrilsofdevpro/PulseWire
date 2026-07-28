import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, Compass, Sparkles, Search } from 'lucide-react'
import { usePremiumAccess } from '../hooks/usePremiumAccess'

const styles = `
  :root { --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
  * { box-sizing:border-box; }
  .pw-news-page { min-height:100vh; background:var(--ink); color:var(--text-d1); font-family:Inter,sans-serif; padding:22px; }
  .pw-news-shell { max-width: 1180px; margin: 0 auto; }
  .pw-news-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .pw-news-title { margin:0; font-size:32px; }
  .pw-news-tag { display:inline-flex; align-items:center; gap:8px; font-size:12px; text-transform:uppercase; color:var(--wire); font-weight:700; letter-spacing:.08em; margin-bottom:10px; }
  .pw-news-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:18px; }
  .pw-news-card { background:var(--ink-raised); border:1px solid var(--border-dark); border-radius:24px; overflow:hidden; box-shadow:var(--shadow); }
  .pw-news-image { min-height:210px; background:#111; background-size:cover; background-position:center; }
  .pw-news-content { padding:22px; }
  .pw-news-content h3 { margin:0 0 12px; font-size:22px; }
  .pw-news-content p { margin:0 0 14px; color:var(--text-d2); line-height:1.7; }
  .pw-news-meta { display:flex; align-items:center; gap:12px; flex-wrap:wrap; font-size:12px; color:var(--text-d3); }
  .pw-news-meta span { font-weight:700; color:var(--wire); }
  .pw-news-actions { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:16px; }
  .pw-link-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; border-radius:999px; border:1px solid var(--border-dark); background:var(--wire); color:#04241f; font-weight:700; }
  .pw-secondary-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; border-radius:999px; border:1px solid var(--border-dark); background:transparent; color:var(--text-d1); font-weight:700; }
  @media (max-width: 900px) { .pw-news-grid { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .pw-news-page { padding:14px; } .pw-news-title { font-size:28px; } }
`

export default function NewsPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestMessage, setIngestMessage] = useState('')
  const { plan, loading: premiumLoading, isPro } = usePremiumAccess()

  useEffect(() => {
    async function loadNews() {
      setLoading(true)
      try {
        const response = await fetch('/api/news/stored')
        const payload = await response.json()
        if (response.ok && Array.isArray(payload.articles)) {
          setArticles(payload.articles)
          setError('')
        } else {
          setError('Unable to load newsroom articles.')
        }
      } catch (err) {
        console.warn('News page load failed:', err)
        setError('Unable to load newsroom articles.')
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  async function handleFetchLatestNews() {
    if (!isPro) {
      router.push('/pricing')
      return
    }

    setIngestLoading(true)
    setIngestMessage('Fetching latest PulseWire Pro stories from NewsData...')

    try {
      const response = await fetch('/api/news/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'us' }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to ingest news')
      }
      setIngestMessage(`Imported ${data.imported || 0} new stories. Scanned ${data.scanned || 0} articles. ${data.duplicates || 0} duplicates were skipped.`)
    } catch (err: any) {
      setIngestMessage(err?.message || 'News import failed.')
    } finally {
      setIngestLoading(false)
    }
  }

  return (
    <div className="pw-news-page">
      <style jsx>{styles}</style>
      <div className="pw-news-shell">
        <div className="pw-news-header">
          <div>
            <div className="pw-news-tag"><Compass size={13} /> Newsroom</div>
            <h1 className="pw-news-title">Latest PulseWire coverage</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="pw-secondary-btn" onClick={() => router.push('/pulsewire')}><ArrowLeft size={16} /> Feed</button>
            <button className="pw-link-btn" onClick={() => router.push('/ai')}><Sparkles size={16} /> Ask PulseWireAI</button>
            <button
              className={`pw-link-btn ${!isPro ? 'pw-secondary-btn' : ''}`}
              disabled={ingestLoading || premiumLoading}
              onClick={handleFetchLatestNews}
            >
              {isPro ? 'Ingest premium news' : 'Upgrade to premium'}
            </button>
          </div>
        </div>

        {(ingestMessage || premiumLoading) && (
          <div className="pw-news-card" style={{ padding: 24, marginBottom: 16 }}>
            <p>{premiumLoading ? 'Checking subscription status…' : ingestMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="pw-news-card" style={{ padding: 24 }}><p>Loading newsroom stories...</p></div>
        ) : error ? (
          <div className="pw-news-card" style={{ padding: 24 }}><p>{error}</p></div>
        ) : (
          <div className="pw-news-grid">
            {articles.map((article) => (
              <article key={article.id || article.url} className="pw-news-card">
                <div className="pw-news-image" style={{ backgroundImage: `url(${article.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80'})` }} />
                <div className="pw-news-content">
                  <div className="pw-news-tag">{article.category || 'News'}</div>
                  <h3>{article.title || 'Untitled story'}</h3>
                  <p>{article.summary || article.description || String(article.content || '').slice(0, 140)}</p>
                  <div className="pw-news-meta">
                    <span>{article.source || article.author || 'PulseWire'}</span>
                    <span>{article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Today'}</span>
                  </div>
                  <div className="pw-news-actions">
                    <button className="pw-link-btn" onClick={() => window.open(article.url || '#', '_blank')}>Read full article</button>
                    <button className="pw-secondary-btn" onClick={() => window.open('/ai', '_self')}>Analyze with AI</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
