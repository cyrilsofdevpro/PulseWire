import type { NextApiRequest, NextApiResponse } from 'next'
import { isAdminAuthenticated } from '../../../../lib/adminAuth'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminAuthenticated(req)) return res.status(401).json({ error: 'Not authenticated' })
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data, error } = await supabaseAdmin.from('manual_payments').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    if (error) throw error
    return res.status(200).json({ ok: true, items: data })
  } catch (err: any) {
    console.error('Failed to list pending payments', err)
    return res.status(500).json({ error: err?.message || 'Failed' })
  }
}
