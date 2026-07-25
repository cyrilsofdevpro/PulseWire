import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured' })

  try {
    const { data, error } = await supabaseAdmin.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) {
      // If the table doesn't exist in Supabase schema cache, return an empty list
      if (error.code === 'PGRST205' || String(error.message).includes('Could not find the table')) {
        console.warn('Notifications table missing, returning empty list')
        return res.status(200).json({ notifications: [] })
      }
      throw error
    }
    return res.status(200).json({ notifications: data || [] })
  } catch (err: any) {
    console.error('Failed to load notifications:', err)
    // If PostgREST indicates missing table, return empty list instead of 500
    if (err && (err.code === 'PGRST205' || String(err.message).includes('Could not find the table'))) {
      return res.status(200).json({ notifications: [] })
    }
    return res.status(500).json({ error: err?.message || 'Unable to load notifications' })
  }
}
