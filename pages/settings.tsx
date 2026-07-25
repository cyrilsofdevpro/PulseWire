import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, User, Mail, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { usePremiumAccess } from '../hooks/usePremiumAccess';

const styles = `
  :root { --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
  * { box-sizing: border-box; }
  .pw-settings-page { min-height:100vh; background:var(--ink); color:var(--text-d1); font-family:Inter,sans-serif; padding:22px; }
  .pw-settings-shell { max-width: 780px; margin: 0 auto; }
  .pw-settings-card { background: var(--ink-raised); border:1px solid var(--border-dark); border-radius: var(--radius); padding:18px; box-shadow: var(--shadow); margin-bottom:16px; }
  .pw-settings-row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-dark); }
  .pw-settings-row:last-child { border-bottom:none; }
  .pw-settings-label { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--wire); font-weight:700; margin-bottom:6px; }
  .pw-settings-value { color: var(--text-d1); font-weight:600; }
  .pw-settings-muted { color: var(--text-d2); }
  .pw-topbar-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; border:1px solid var(--border-dark); background:transparent; color:var(--text-d1); cursor:pointer; }
  .pw-upgrade-btn { background: var(--wire); color: #071118; border:none; padding:10px 16px; border-radius:999px; cursor:pointer; font-weight:700; transition: transform .15s ease, opacity .15s ease; }
  .pw-upgrade-btn:hover { transform: translateY(-1px); opacity: .92; }
  .pw-upgrade-row { align-items: center; }
  .pw-title { font-size: 30px; margin: 0 0 12px; }
  .pw-subtitle { color: var(--text-d2); margin:0 0 16px; }
  @media (max-width: 640px) { .pw-settings-page { padding: 14px; } .pw-title { font-size: 24px; } .pw-settings-row { flex-direction: column; } }
`;

interface UserSettingsState {
  name: string;
  email: string;
  bio: string;
  website: string;
  location: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { plan, loading, isPro } = usePremiumAccess();
  const [user, setUser] = useState<UserSettingsState>({
    name: 'PulseWire member',
    email: '',
    bio: 'Your profile information will appear here after login.',
    website: 'Not set',
    location: 'Not set',
  });

  useEffect(() => {
    async function loadAccount() {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        return;
      }

      const metadata = (data.user.user_metadata || {}) as any;
      setUser({
        name: metadata.username || metadata.name || metadata.full_name || data.user.email || 'PulseWire member',
        email: data.user.email || '',
        bio: metadata.bio || 'Welcome to your PulseWire profile.',
        website: metadata.website || 'Not set',
        location: metadata.location || 'Not set',
      });
    }

    loadAccount();
  }, [router]);

  return (
    <div className="pw-settings-page">
      <style jsx>{styles}</style>
      <div className="pw-settings-shell">
        <button className="pw-topbar-btn" onClick={() => router.push('/dashboard')}><ArrowLeft size={16} /> Back to dashboard</button>
        <h1 className="pw-title">Account settings</h1>
        <p className="pw-subtitle">Your saved account information stays visible after login.</p>

        <section className="pw-settings-card">
          <div className="pw-settings-row">
            <div>
              <div className="pw-settings-label"><User size={13} /> Name</div>
              <div className="pw-settings-value">{user.name}</div>
            </div>
            <div className="pw-settings-muted">This is pulled from your logged-in profile.</div>
          </div>
          <div className="pw-settings-row">
            <div>
              <div className="pw-settings-label"><Mail size={13} /> Email</div>
              <div className="pw-settings-value">{user.email || 'Not connected'}</div>
            </div>
            <div className="pw-settings-muted">Your Supabase account email remains attached to the session.</div>
          </div>
          <div className="pw-settings-row">
            <div>
              <div className="pw-settings-label">Bio</div>
              <div className="pw-settings-value">{user.bio}</div>
            </div>
            <div className="pw-settings-muted">This appears on your public profile page.</div>
          </div>
          <div className="pw-settings-row">
            <div>
              <div className="pw-settings-label"><Globe size={13} /> Website</div>
              <div className="pw-settings-value">{user.website}</div>
            </div>
            <div className="pw-settings-muted">Optional public link for your profile.</div>
          </div>
          <div className="pw-settings-row">
            <div>
              <div className="pw-settings-label">Location</div>
              <div className="pw-settings-value">{user.location}</div>
            </div>
            <div className="pw-settings-muted">Your audience can view this on the profile card.</div>
          </div>
          {!loading && !isPro && (
            <div className="pw-settings-row pw-upgrade-row">
              <div>
                <div className="pw-settings-label">Premium access</div>
                <div className="pw-settings-value">Free plan</div>
              </div>
              <button className="pw-upgrade-btn" onClick={() => router.push('/pricing')}>
                Upgrade to Premium
              </button>
            </div>
          )}
          {!loading && isPro && (
            <div className="pw-settings-row">
              <div>
                <div className="pw-settings-label">Plan</div>
                <div className="pw-settings-value">{plan === 'enterprise' ? 'Enterprise' : 'Pro'}</div>
              </div>
              <div className="pw-settings-muted">Thanks for being a premium subscriber.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
