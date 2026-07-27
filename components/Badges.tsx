import React from 'react'

export default function Badges({ badges }: { badges?: Array<{ name: string; icon?: string; description?: string }> }) {
  if (!badges || badges.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {badges.map((b) => (
        <div key={b.name} title={b.description} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 999, border: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.icon || '★'}</span>
          <span style={{ fontWeight: 600 }}>{b.name}</span>
        </div>
      ))}
    </div>
  )
}
