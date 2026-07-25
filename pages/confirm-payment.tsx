import { useState } from 'react'
import { useRouter } from 'next/router'

type ReceiptDetails = {
  id: string
  full_name: string
  email: string
  amount: string
  receipt_url?: string | null
  note?: string | null
  status: string
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const parseAmount = (value: string) => {
  const cleaned = String(value).trim().replace(/[^0-9.]/g, '')
  const numeric = Number(cleaned)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

export default function ConfirmPaymentPage() {
  const [fullName, setFullName] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null)
  const router = useRouter()

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required.'
    if (!payerEmail.trim()) return 'Email is required.'
    if (!isValidEmail(payerEmail.trim())) return 'Enter a valid email address.'
    if (!amount.trim()) return 'Amount is required.'
    if (parseAmount(amount) === null) return 'Enter a valid payment amount.'
    return ''
  }

  const submit = async (e: any) => {
    e.preventDefault()
    setError('')
    setStatus('')

    const validationMessage = validate()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setStatus('Submitting...')
    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, payerEmail, amount, receiptUrl, note })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      const payment = data.payment
      setReceipt({
        id: payment.id,
        full_name: payment.full_name,
        email: payment.email,
        amount: String(payment.amount),
        receipt_url: payment.receipt_url,
        note: payment.note,
        status: payment.status
      })
      setStatus('Submitted. Admin will review and approve shortly.')
      setFullName('')
      setPayerEmail('')
      setAmount('')
      setReceiptUrl('')
      setNote('')
    } catch (err: any) {
      console.error(err)
      setStatus('Submission failed: ' + (err?.message || ''))
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '40px auto', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ marginBottom: 8 }}>Confirm manual payment</h2>
      <p style={{ color: '#8a96ac', marginBottom: 24 }}>After contacting support via email, use this form to confirm your payment so our team can verify and grant premium access.</p>

      <form onSubmit={submit} style={{ display: 'grid', gap: 14, background: '#0f1724', padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ color: '#cbd5e1', fontSize: 14 }}>Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: '#07111d', color: '#f8fafc', padding: '12px 14px' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ color: '#cbd5e1', fontSize: 14 }}>Email address</label>
          <input
            value={payerEmail}
            onChange={(e) => setPayerEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: '#07111d', color: '#f8fafc', padding: '12px 14px' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ color: '#cbd5e1', fontSize: 14 }}>Amount paid</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$15"
            style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: '#07111d', color: '#f8fafc', padding: '12px 14px' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ color: '#cbd5e1', fontSize: 14 }}>Receipt URL (optional)</label>
          <input
            value={receiptUrl}
            onChange={(e) => setReceiptUrl(e.target.value)}
            placeholder="https://..."
            style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: '#07111d', color: '#f8fafc', padding: '12px 14px' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ color: '#cbd5e1', fontSize: 14 }}>Note or receipt details</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note or payment reference"
            style={{ width: '100%', minHeight: 120, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: '#07111d', color: '#f8fafc', padding: '12px 14px', resize: 'vertical' }}
          />
        </div>

        {error ? <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div> : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="submit" style={{ background: 'linear-gradient(135deg, #22c55e, #3b82f6)', border: 'none', color: '#fff', padding: '12px 18px', borderRadius: 12, cursor: 'pointer' }}>
            Confirm payment
          </button>
          <button
            type="button"
            onClick={() => window.location.assign(`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@pulsewire.news'}`)}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#f8fafc', padding: '12px 18px', borderRadius: 12, cursor: 'pointer' }}
          >
            Email support
          </button>
        </div>

        {status ? <div style={{ color: '#cbd5e1', fontSize: 14 }}>{status}</div> : null}
      </form>

      {receipt ? (
        <div style={{ marginTop: 24, borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: '#0f1724', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Payment receipt</div>
              <div style={{ color: '#94a3b8', marginTop: 4 }}>Keep this confirmation for your records and share it with support if needed.</div>
            </div>
            <div style={{ color: '#7dd3fc', fontWeight: 700, fontSize: 14, background: 'rgba(59, 130, 246, 0.12)', borderRadius: 999, padding: '6px 12px' }}>{receipt.status}</div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Name</div>
              <div style={{ color: '#f8fafc' }}>{receipt.full_name}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Email</div>
              <div style={{ color: '#f8fafc' }}>{receipt.email}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Amount</div>
              <div style={{ color: '#f8fafc' }}>{receipt.amount}</div>
            </div>
            {receipt.receipt_url ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Receipt URL</div>
                <a href={receipt.receipt_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>{receipt.receipt_url}</a>
              </div>
            ) : null}
            {receipt.note ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Note</div>
                <div style={{ color: '#f8fafc' }}>{receipt.note}</div>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => router.push('/')}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#f8fafc', padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}
              >
                Return home
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
