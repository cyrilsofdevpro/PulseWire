import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured' })

  try {
    const { fullName, payerEmail, amount, note, receiptUrl } = req.body || {}
    if (!fullName || !payerEmail || !amount) return res.status(400).json({ error: 'fullName, payerEmail and amount are required' })

    // try to find user id by email
    let userId: string | null = null
    try {
      const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const match = list?.data?.users?.find((u: any) => (u.email || '').toLowerCase() === String(payerEmail).toLowerCase())
      if (match) userId = match.id
    } catch (e) {
      // ignore
    }

    const insert = {
      user_id: userId,
      email: payerEmail,
      full_name: fullName,
      amount: amount,
      receipt_url: receiptUrl || null,
      note: note || null,
      status: 'pending'
    }

    const { data: mp, error: mpErr } = await supabaseAdmin.from('manual_payments').insert(insert).select('*').single()
    if (mpErr) throw mpErr

    // create an admin notification for review
    const title = `Payment confirmation: ${fullName}`
    const message = `${fullName} reported a payment of ${amount}. Email: ${payerEmail}. ${note || ''}`
    const metadata = { type: 'manual_payment', manual_payment_id: mp.id, fullName, payerEmail, amount, note: note || '', status: 'pending' }
    await supabaseAdmin.from('notifications').insert({ title, message, metadata })

    return res.status(201).json({ ok: true, payment: mp })
  } catch (err: any) {
    console.error('Failed to create manual payment record:', err)
    return res.status(500).json({ error: err?.message || 'Unable to submit payment confirmation' })
  }
}

