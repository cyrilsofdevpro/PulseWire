import type { ReactNode } from 'react';

export type AdminSection = 'overview' | 'users' | 'content' | 'revenue' | 'ai' | 'settings' | 'payments';

type AdminShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  activeSection?: AdminSection;
  onSectionChange?: (section: AdminSection) => void;
  stats?: { totalArticles?: number; pendingPayments?: number } | null;
};

export default function AdminShell({ title, subtitle, children, activeSection = 'overview', onSectionChange, stats }: AdminShellProps) {
  const sections: Array<{ key: AdminSection; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'content', label: 'Content' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'payments', label: 'Payments' },
    { key: 'ai', label: 'AI' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">PulseWire</div>
          <div className="admin-brand-sub">Owner control center</div>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`admin-nav-btn ${activeSection === section.key ? 'active' : ''}`}
              onClick={() => onSectionChange?.(section.key)}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{section.label}</span>
                {section.key === 'content' && stats?.totalArticles ? (
                  <span style={{ background: 'rgba(92,225,197,0.12)', color: '#5ce1c7', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{String(stats.totalArticles)}</span>
                ) : null}
                  {section.key === 'payments' && stats?.pendingPayments ? (
                    <span style={{ background: 'rgba(255,196,98,0.12)', color: '#FFD36B', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{String(stats.pendingPayments)}</span>
                  ) : null}
              </span>
            </button>
          ))}
        </nav>
        <div className="admin-panel-card">
          <div className="kicker">Security</div>
          <strong>Password-protected access</strong>
          <p>Server-validated sessions and hidden routes keep the control center private.</p>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="kicker">Admin</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="admin-topbar-actions">
            <button className="ghost-btn" type="button">Search</button>
            <button className="primary-btn" type="button">Quick actions</button>
          </div>
        </header>
        {children}
      </main>
      <style jsx global>{`
        :root { color-scheme: dark; }
        body { margin: 0; background: #07111d; color: #f7fbff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        * { box-sizing: border-box; }
        .admin-shell { min-height: 100vh; display: grid; grid-template-columns: 280px 1fr; background: radial-gradient(circle at top left, rgba(7, 174, 255, 0.18), transparent 32%), linear-gradient(135deg, #07111d 0%, #0c1827 100%); }
        .admin-sidebar { padding: 24px; border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 24px; }
        .admin-brand { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .admin-brand-sub { margin-top: 6px; color: #7f93b0; font-size: 13px; }
        .admin-nav { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
        .admin-nav-btn { padding: 10px 12px; border-radius: 12px; color: #9bb0c7; font-size: 14px; border: none; background: transparent; text-align: left; cursor: pointer; }
        .admin-nav-btn.active { background: rgba(255,255,255,0.08); color: #fff; }
        .admin-panel-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 14px; background: rgba(255,255,255,0.04); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
        .admin-panel-card p { color: #86a0b7; font-size: 13px; line-height: 1.6; margin-bottom: 0; }
        .admin-main { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
        .admin-topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 22px; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; background: rgba(255,255,255,0.04); backdrop-filter: blur(16px); }
        .admin-topbar h1 { margin: 4px 0 4px; font-size: 24px; }
        .admin-topbar p { margin: 0; color: #8ca0b3; }
        .kicker { color: #5ce1c7; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; }
        .admin-topbar-actions { display: flex; gap: 10px; }
        .ghost-btn, .primary-btn { border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.06); color: #f7fbff; padding: 10px 14px; border-radius: 999px; cursor: pointer; }
        .primary-btn { background: linear-gradient(135deg, #09c8a2, #2f7bff); border: none; }
        .grid { display: grid; gap: 14px; }
        .stats-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        .card { border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 16px; background: rgba(255,255,255,0.04); box-shadow: 0 18px 45px rgba(3, 10, 20, 0.25); }
        .metric-label { color: #8ca0b3; font-size: 13px; margin-bottom: 6px; }
        .metric-value { font-size: 24px; font-weight: 700; }
        .metric-trend { margin-top: 8px; color: #5ce1c7; font-size: 13px; }
        .panel-grid { grid-template-columns: 1.3fr 0.9fr; }
        .list { display: flex; flex-direction: column; gap: 10px; }
        .list-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #c6d3e3; }
        .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(92,225,197,0.15); color: #5ce1c7; }
        .bar-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .bar { flex: 1; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.09); overflow: hidden; }
        .bar > i { display: block; height: 100%; background: linear-gradient(90deg, #2f7bff, #5ce1c7); border-radius: inherit; }
        .ai-input-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .ai-input-row input { flex: 1; min-width: 220px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); border-radius: 999px; padding: 10px 14px; color: #f7fbff; }
        .ai-input-row input, .card select, .card textarea { width: 100%; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); border-radius: 12px; padding: 10px 12px; color: #f7fbff; }
        .card textarea { resize: vertical; min-height: 120px; }
        .ai-bubble { padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,0.06); color: #dce6f5; line-height: 1.6; }
        .ai-bubble.user { background: rgba(47,123,255,0.18); }
        .ai-example { border: 1px solid rgba(255,255,255,0.08); padding: 8px 10px; border-radius: 999px; background: rgba(255,255,255,0.04); color: #c3d2e0; cursor: pointer; }
        @media (max-width: 900px) { .admin-shell { grid-template-columns: 1fr; } .admin-sidebar { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); } .panel-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
