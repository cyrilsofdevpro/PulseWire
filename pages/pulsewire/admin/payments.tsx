import { useEffect, useState } from 'react'
import type { GetServerSideProps, NextPage } from 'next'
import AdminShell, { type AdminSection } from '../../../components/AdminShell'
import { isAdminAuthenticated } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getAdminDashboardStats } from '../../../lib/adminStats'
import { useRouter } from 'next/router'

type PaymentRow = {
  id: string;
  user_id?: string | null;
  email: string;
  full_name: string;
  amount: string | number;
  note?: string | null;
  status: string;
  created_at: string;
}

const AdminPayments: NextPage<{ stats: any; initialRows: PaymentRow[] }> = ({ stats, initialRows }) => {
  const router = useRouter()
  const [rows, setRows] = useState<PaymentRow[]>(initialRows || [])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payments/list')
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed')
      setRows(payload.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialRows || !initialRows.length) {
      fetchPending()
    }
  }, [initialRows])

  const approve = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/payments/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ manualPaymentId: id }) })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed')
      await fetchPending()
    } catch (err) {
      console.error(err)
      alert('Approve failed')
    } finally {
      setActionLoading(null)
    }
  }

  const reject = async (id: string) => {
    const comment = window.prompt('Optional rejection comment for the user:') || ''
    if (!window.confirm('Reject this payment confirmation?')) return
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/payments/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ manualPaymentId: id, comment }) })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed')
      await fetchPending()
    } catch (err) {
      console.error(err)
      alert('Reject failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminShell title="Payments" subtitle="Review manual payment confirmations" activeSection={'payments' as AdminSection} stats={stats} onSectionChange={(s) => { if (s === 'payments') return; router.push('/pulsewire/admin') }}>
      <div style={{ display: 'grid', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Pending manual payments</div>
            <div style={{ color: '#8ca0b3', marginTop: 4 }}>Review new confirmations and grant premium access.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="pill" style={{ background: 'rgba(92,225,197,0.12)', color: '#5ce1c7' }}>{rows.length} pending</div>
            <button type="button" onClick={fetchPending} className="ghost-btn" style={{ minWidth: 110 }}>
              {loading ? 'Refreshing…' : 'Refresh list'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>Loading pending payments…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>No pending confirmations</div>
            <div style={{ color: '#8ca0b3' }}>All manual payment requests have been reviewed.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {rows.map((r) => (
              <div key={r.id} style={{ padding: 20, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, background: 'rgba(255,255,255,0.02)', display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{r.full_name}</div>
                    <div style={{ color: '#8ca0b3', marginTop: 4 }}>{r.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ color: '#f8fafc', background: 'rgba(37,99,235,0.16)', borderRadius: 999, padding: '6px 12px', fontSize: 13 }}>{String(r.amount)}</div>
                    <div style={{ color: '#f8fafc', background: 'rgba(148,163,184,0.14)', borderRadius: 999, padding: '6px 12px', fontSize: 12, textTransform: 'uppercase' }}>{r.status}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 10, color: '#c6d3e3' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 1.6fr', gap: 16 }}>
                    <div style={{ color: '#94a3b8', fontSize: 13 }}>Submitted</div>
                    <div>{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  {r.note ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 1.6fr', gap: 16 }}>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>Note</div>
                      <div>{r.note}</div>
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => approve(r.id)}
                    className="primary-btn"
                    disabled={actionLoading === r.id}
                    style={{ minWidth: 110 }}
                  >
                    {actionLoading === r.id ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(r.id)}
                    className="ghost-btn"
                    disabled={actionLoading === r.id}
                    style={{ minWidth: 110 }}
                  >
                    {actionLoading === r.id ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!isAdminAuthenticated(context.req)) {
    return { redirect: { destination: '/pulsewire/admin/login', permanent: false } }
  }

  const stats = await getAdminDashboardStats()
  const { data: rows } = await supabaseAdmin.from('manual_payments').select('*').eq('status', 'pending').order('created_at', { ascending: false })
  return { props: { stats, initialRows: rows || [] } }
}

export default AdminPayments
