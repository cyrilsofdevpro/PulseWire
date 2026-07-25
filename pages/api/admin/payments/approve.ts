import type { NextApiRequest, NextApiResponse } from 'next'
import { isAdminAuthenticated } from '../../../../lib/adminAuth'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminAuthenticated(req)) return res.status(401).json({ error: 'Not authenticated' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured' })

  try {
    const { manualPaymentId } = req.body || {}
    if (!manualPaymentId) return res.status(400).json({ error: 'manualPaymentId is required' })

    // fetch manual payment record
    const { data: mp, error: mpErr } = await supabaseAdmin.from('manual_payments').select('*').eq('id', manualPaymentId).maybeSingle()
    if (mpErr) throw mpErr
    if (!mp) return res.status(404).json({ error: 'Manual payment not found' })

    // update manual_payments status
    const approvedAt = new Date().toISOString()
    const { error: updateErr } = await supabaseAdmin.from('manual_payments').update({ status: 'approved', approved_at: approvedAt, approved_by: null }).eq('id', manualPaymentId)
    if (updateErr) throw updateErr

    const payerEmail = mp.email

    // find the user by email and set app_metadata.plan = 'pro'
    try {
      const usersRes = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const users = usersRes?.data?.users || []
      const match = users.find((u: any) => (u.email || '').toLowerCase() === (String(payerEmail || '').toLowerCase()))
      if (match && match.id) {
        await supabaseAdmin.auth.admin.updateUserById(match.id, {
          app_metadata: { ...(match.app_metadata || {}), plan: 'pro' },
          user_metadata: { ...(match.user_metadata || {}), plan: 'pro' },
        })

        // create a user notification
        const noteTitle = `Payment approved — premium enabled`;
        const noteMessage = `Your payment of ${mp.amount} has been approved and your PulseWire Pro access is active.`;
        const metadata = { type: 'payment_approved', manual_payment_id: manualPaymentId, amount: mp.amount }
        await supabaseAdmin.from('notifications').insert({ title: noteTitle, message: noteMessage, user_id: match.id, metadata })
      }
    } catch (e) {
      console.error('Failed to set user plan:', e)
    }

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('Approve payment failed:', err)
    return res.status(500).json({ error: err?.message || 'Failed to approve payment' })
  }
}
