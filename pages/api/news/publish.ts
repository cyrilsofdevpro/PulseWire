import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

function simpleHashId(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = ((h << 5) - h + value.charCodeAt(i)) | 0
  }
  return `news-${Math.abs(h)}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase admin not configured' })

  try {
    const body = req.body
    const entries = Array.isArray(body) ? body : [body]

    const payload = entries.map((item: any) => {
      const url = String(item.url || item.link || '')
      const id = String(item.id || item.article_id || simpleHashId(url || String(item.title || '')))
      return {
        id,
        title: String(item.title || item.headline || 'Untitled'),
        description: String(item.description || ''),
        content: String(item.content || item.description || ''),
        image: String(item.image || item.image_url || item.media || '') || null,
        source: String(item.source || item.source_name || item.source_id || '') || null,
        author: Array.isArray(item.creator) ? String(item.creator[0]) : String(item.author || item.creator || '') || null,
        published_at: item.pubDate || item.publishedAt || null,
        category: item.category ? (Array.isArray(item.category) ? String(item.category[0]) : String(item.category)) : 'World',
        country: Array.isArray(item.country) ? String(item.country[0]) : String(item.country || ''),
        url: url || id,
        summary: item.summary || null,
        tldr: item.tldr || null,
        seo_title: item.seo_title || null,
        meta_description: item.meta_description || null,
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        suggested_category: item.suggested_category || null,
        social_caption: item.social_caption || null,
        imported_at: new Date().toISOString(),
        published: true,
      }
    })

    const { data, error } = await supabaseAdmin.from('news_articles').insert(payload).select('*')
    if (error) throw error

    // Post-publish: create feed posts and broadcast notifications so users see new articles
    try {
      const inserted = Array.isArray(data) ? data : [data]

      const postsPayload = inserted.map((rec: any) => ({
        title: rec.title || rec.description || 'PulseWire story',
        excerpt: rec.description || rec.summary || rec.title || '',
        category: rec.category || 'World',
        author_email: null,
        author_name: rec.source || 'PulseWire',
        content: rec.content || rec.description || '',
        image_urls: rec.image ? JSON.stringify([rec.image]) : '[]',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: rec.imported_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error: postsErr } = await supabaseAdmin.from('posts').insert(postsPayload)
      if (postsErr) console.warn('Failed to create feed posts for news publish:', postsErr)

      const notificationsPayload = inserted.slice(0, 5).map((rec: any) => ({
        title: `New PulseWire story: ${rec.title}`,
        message: `A new article is available: ${rec.title}`,
        metadata: { articleUrl: rec.url, category: rec.category },
        created_at: new Date().toISOString(),
      }))
      const { error: notifErr } = await supabaseAdmin.from('notifications').insert(notificationsPayload)
      if (notifErr) console.warn('Failed to create notifications for news publish:', notifErr)
    } catch (e: any) {
      console.warn('Post-publish hooks failed:', e)
    }

    return res.status(200).json({ inserted: Array.isArray(data) ? data.length : 0, records: data })
  } catch (err: any) {
    console.error('Publish failed:', err)
    return res.status(500).json({ error: err?.message || 'Publish failed' })
  }
}
