import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured' })

  try {
    const { data, error } = await supabaseAdmin
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .order('imported_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return res.status(200).json({ articles: data || [] })
  } catch (err: any) {
    console.error('Failed to load stored news:', err)
    return res.status(500).json({ error: err?.message || 'Unable to load stored news' })
  }
}
