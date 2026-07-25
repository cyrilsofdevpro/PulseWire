import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase is not configured yet.' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { postId, content, authorName } = req.body || {}
    if (!postId || !content || !String(content).trim()) {
      return res.status(400).json({ error: 'postId and content are required' })
    }

    const payload = {
      post_id: String(postId),
      content: String(content).trim(),
      author_name: String(authorName || 'PulseWire user').trim(),
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from('comments').insert(payload).select('*').single()
    if (error) throw error

    return res.status(201).json({ comment: data })
  } catch (error: any) {
    console.error('Failed to create comment:', error)
    return res.status(500).json({ error: error?.message || 'Unable to create comment' })
  }
}
