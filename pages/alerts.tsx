import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const styles = `
  :root { --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
  * { box-sizing: border-box; }
  .pw-alerts { min-height:100vh; background:var(--ink); color:var(--text-d1); font-family:Inter,sans-serif; padding:24px; }
  .pw-alerts-shell { max-width: 920px; margin: 0 auto; }
  .pw-alerts-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .pw-alerts-title { font-size: 30px; margin: 0; }
  .pw-back-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; border:1px solid var(--border-dark); background:transparent; color:var(--text-d1); cursor:pointer; }
  .pw-alert-card { background: var(--ink-raised); border:1px solid var(--border-dark); border-radius: var(--radius); padding:18px; margin-bottom:14px; }
  .pw-alert-card h3 { margin: 0 0 8px; }
  .pw-alert-card p { margin:0; color:var(--text-d2); line-height:1.6; }
  .pw-alert-tag { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color: var(--wire); margin-bottom: 10px; }
  @media (max-width: 640px) { .pw-alerts { padding: 14px; } .pw-alerts-title { font-size: 24px; } }
`;

export default function AlertsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Array<{ title: string; body: string; kind: string }>>([]);

  useEffect(() => {
    async function loadAlerts() {
      if (!supabase) {
        setItems([
          { title: 'PulseWire is ready', body: 'Sign in to see live alerts, saved story activity, and AI recommendations for your account.', kind: 'Info' },
        ]);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user?.email) {
        setItems([
          { title: 'PulseWire is ready', body: 'Sign in to see live alerts, saved story activity, and AI recommendations for your account.', kind: 'Info' },
        ]);
        return;
      }

      try {
        const response = await fetch('/api/notifications')
        const payload = await response.json()
        const rows = Array.isArray(payload.notifications) ? payload.notifications : []

        if (rows.length === 0) {
          setItems([
            { title: 'No alerts yet', body: 'No recent notifications are available.', kind: 'Info' },
          ])
          return
        }

        const mapped = rows.map((r: any) => ({ title: r.title || 'Notification', body: r.message || '', kind: 'Update' }))
        setItems(mapped)
      } catch (error) {
        console.warn('Failed to load alerts:', error)
        setItems([
          { title: 'Unable to refresh alerts', body: 'Live alerts are unavailable right now. Please try again in a moment.', kind: 'Error' },
        ])
      }
    }

    loadAlerts();
  }, []);

  return (
    <div className="pw-alerts">
      <style jsx>{styles}</style>
      <div className="pw-alerts-shell">
        <div className="pw-alerts-header">
          <div>
            <div className="pw-alert-tag"><Bell size={13} /> Alerts</div>
            <h1 className="pw-alerts-title">Latest news updates</h1>
          </div>
          <button className="pw-back-btn" onClick={() => router.push('/dashboard')}><ArrowLeft size={16} /> Back to dashboard</button>
        </div>

        {items.map((item, index) => (
          <section key={`${item.title}-${index}`} className="pw-alert-card">
            <div className="pw-alert-tag"><Sparkles size={13} /> {item.kind}</div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
