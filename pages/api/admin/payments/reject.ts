import type { NextApiRequest, NextApiResponse } from 'next'
import { isAdminAuthenticated } from '../../../../lib/adminAuth'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminAuthenticated(req)) return res.status(401).json({ error: 'Not authenticated' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured' })

  try {
    const { manualPaymentId, comment } = req.body || {}
    if (!manualPaymentId) return res.status(400).json({ error: 'manualPaymentId is required' })

    const rejectedAt = new Date().toISOString()
    const { error } = await supabaseAdmin.from('manual_payments').update({ status: 'rejected', approved_at: rejectedAt, audit: { rejected_reason: comment || '' } }).eq('id', manualPaymentId)
    if (error) throw error

    // optionally notify the user if present
    const { data: mp } = await supabaseAdmin.from('manual_payments').select('*').eq('id', manualPaymentId).maybeSingle()
    if (mp && mp.user_id) {
      const noteTitle = `Payment rejected`
      const noteMessage = `Your payment confirmation was rejected by the admin. ${comment || ''}`
      const metadata = { type: 'payment_rejected', manual_payment_id: manualPaymentId }
      await supabaseAdmin.from('notifications').insert({ title: noteTitle, message: noteMessage, user_id: mp.user_id, metadata })
    }

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('Reject failed:', err)
    return res.status(500).json({ error: err?.message || 'Failed to reject' })
  }
}
