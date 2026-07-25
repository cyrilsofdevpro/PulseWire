import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Check, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const styles = `
  :root { --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
  * { box-sizing: border-box; }
  .pw-settings-page { min-height:100vh; background:var(--ink); color:var(--text-d1); font-family:Inter,sans-serif; padding:22px 16px 80px; }
  .pw-settings-shell { max-width: 640px; margin: 0 auto; }
  .pw-back-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; border:1px solid var(--border-dark); background:transparent; color:var(--text-d1); cursor:pointer; margin-bottom:16px; }
  .pw-settings-title { font-size:26px; margin:14px 0 6px; }
  .pw-settings-subtitle { color:var(--text-d2); margin:0 0 22px; }
  .pw-settings-group { border:1px solid var(--border-dark); border-radius: var(--radius); background:var(--ink-raised); margin-bottom:20px; overflow:hidden; }
  .pw-settings-group h3 { font-size:12px; text-transform:uppercase; letter-spacing:.07em; color:var(--text-d3); padding:14px 18px 6px; margin:0; }
  .pw-settings-row { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-top:1px solid var(--border-dark); gap:14px; flex-wrap:wrap; }
  .pw-settings-group h3 + .pw-settings-row { border-top:none; }
  .pw-settings-row-label { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .pw-settings-row-label strong { font-size:14.5px; font-weight:600; }
  .pw-settings-row-label span { font-size:12.5px; color:var(--text-d3); }
  .pw-field { margin-bottom:16px; }
  .pw-field label { display:block; font-size:12.5px; font-weight:600; color:var(--text-d2); margin-bottom:7px; }
  .pw-input { width:100%; padding:10px 12px; border:1px solid var(--border-dark); border-radius:12px; background:var(--ink-raised-2); color:var(--text-d1); font-size:14px; font-family:inherit; }
  .pw-input:focus { outline:none; border-color:var(--wire); box-shadow:0 0 0 3px rgba(0, 217, 184, 0.2); }
  .pw-input::placeholder { color:var(--text-d3); }
  .pw-textarea { resize:vertical; min-height:90px; }
  .pw-switch { width:48px; height:28px; border-radius:100px; border:1px solid var(--border-dark); background:var(--ink-raised-2); position:relative; flex-shrink:0; padding:0; cursor:pointer; }
  .pw-switch-knob { width:22px; height:22px; border-radius:50%; background:#fff; position:absolute; top:2px; left:2px; transition:transform .25s ease; box-shadow:0 1px 3px rgba(0,0,0,.3); }
  .pw-switch.on { background:var(--wire); border-color:var(--wire); }
  .pw-switch.on .pw-switch-knob { transform:translateX(20px); }
  .pw-interest-chip { padding:9px 15px; border-radius:100px; border:1.5px solid var(--border-dark); background:var(--ink-raised-2); font-size:13.5px; font-weight:600; color:var(--text-d2); display:inline-flex; align-items:center; gap:6px; cursor:pointer; margin-right:8px; margin-bottom:8px; }
  .pw-interest-chip.picked { background:var(--wire); border-color:var(--wire); color:#04241f; }
  .pw-interest-grid { display:flex; flex-wrap:wrap; gap:0; margin-bottom:8px; }
  .pw-provider-chip { padding:9px 15px; border-radius:100px; border:1.5px solid var(--border-dark); background:var(--ink-raised-2); font-size:13.5px; font-weight:600; color:var(--text-d2); display:inline-flex; align-items:center; gap:6px; cursor:pointer; margin-right:10px; }
  .pw-provider-chip.active { border-color:var(--wire); color:var(--wire); background:rgba(0, 217, 184, 0.1); }
  .pw-btn-primary { background:var(--wire); color:#04241f; border:none; padding:14px 26px; border-radius:100px; font-weight:700; font-size:15px; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:.2s; }
  .pw-btn-primary:hover { background:var(--wire-dim); }
  .pw-ghost-btn { background:transparent; border:1px solid var(--border-dark); color:var(--text-d1); padding:10px 18px; border-radius:100px; font-weight:600; font-size:14px; cursor:pointer; }
  .pw-ghost-btn:hover { border-color:var(--wire); color:var(--wire); }
  .pw-settings-danger { color:var(--alert); }
  .pw-row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .pw-avatar-preview { width:72px; height:72px; border-radius:24px; background:var(--ink-raised-2); border:1px solid var(--border-dark); display:flex; align-items:center; justify-content:center; color:var(--text-d2); font-weight:700; font-size:20px; overflow:hidden; }
  .pw-avatar-preview img { width:100%; height:100%; object-fit:cover; }
  .pw-photo-actions { display:flex; gap:16px; flex-wrap:wrap; align-items:center; width:100%; }
  .pw-photo-buttons { display:flex; gap:10px; flex-wrap:wrap; }
  @media (max-width:768px) { .pw-settings-page { padding:14px 12px 110px; } .pw-row2 { grid-template-columns:1fr; } .pw-settings-row { padding:13px 14px; } }
`;

const CATEGORIES = ['Technology', 'AI', 'Business', 'Finance', 'Cryptocurrency', 'Politics', 'Sports', 'Entertainment', 'Health', 'Education', 'Science', 'World News'];

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button className={`pw-switch ${on ? 'on' : ''}`} onClick={onClick} type="button" />;
}

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '', lastName: '', displayName: '', bio: '', email: '', dob: '', 
    interests: [] as string[], language: 'English'
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [notif, setNotif] = useState({ breaking: true, comments: true, follows: false, email: true, push: true });
  const [privacy, setPrivacy] = useState({ publicProfile: true, searchIndex: false, messageRequests: true });
  const [aiProvider, setAiProvider] = useState('ChatGPT');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const displayName = form.displayName?.trim() || `${form.firstName} ${form.lastName}`.trim() || 'PulseWire user';
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    async function loadSettings() {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        return;
      }

      const metadata = (data.user.user_metadata || {}) as any;
      setForm({
        firstName: metadata.first_name || '',
        lastName: metadata.last_name || '',
        displayName: metadata.display_name || '',
        bio: metadata.bio || '',
        email: data.user.email || '',
        dob: metadata.dob || '',
        interests: metadata.interests || [],
        language: metadata.language || 'English',
      });
      setAiProvider(metadata.ai_provider || 'ChatGPT');
      setLoading(false);
    }
    loadSettings();
  }, [router]);

  const toggleInterest = (cat: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(cat) ? f.interests.filter(c => c !== cat) : [...f.interests, cat]
    }));
  };

  const saveSettings = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          display_name: form.displayName,
          bio: form.bio,
          dob: form.dob,
          interests: form.interests,
          language: form.language,
          ai_provider: aiProvider,
        }
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="pw-settings-page"><div className="pw-settings-shell">Loading...</div></div>;

  return (
    <div className="pw-settings-page">
      <style jsx>{styles}</style>
      <div className="pw-settings-shell">
        <button className="pw-back-btn" onClick={() => router.back()}><ArrowLeft size={16} /> Back</button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' }}>
          <div>
            <h1 className="pw-settings-title">Settings</h1>
            <p className="pw-settings-subtitle">Update your profile, preferences, and account settings.</p>
          </div>
          <button className="pw-btn-primary" onClick={saveSettings}>{saved ? '✓ Saved' : 'Save changes'}</button>
        </div>

        <div className="pw-settings-group">
          <h3>Profile</h3>
          <div className="pw-settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="pw-settings-row-label"><strong>Profile photo</strong></div>
            <div className="pw-photo-actions">
              <div className="pw-avatar-preview">{photoPreview ? <img src={photoPreview} alt="Profile" /> : initials}</div>
              <div className="pw-photo-buttons">
                <label className="pw-ghost-btn" style={{ cursor: 'pointer' }}>
                  {photoFile ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" hidden onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                </label>
                {photoFile && <button className="pw-ghost-btn" onClick={() => setPhotoFile(null)}>Remove</button>}
              </div>
            </div>
          </div>

          <div className="pw-settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="pw-row2">
              <div className="pw-field" style={{ marginBottom: 0 }}>
                <label>First name</label>
                <input className="pw-input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="pw-field" style={{ marginBottom: 0 }}>
                <label>Last name</label>
                <input className="pw-input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="pw-settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="pw-field" style={{ marginBottom: 0 }}>
              <label>Display name</label>
              <input className="pw-input" value={form.displayName} placeholder="Your public name" onChange={e => setForm({ ...form, displayName: e.target.value })} />
            </div>
          </div>

          <div className="pw-settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="pw-field" style={{ marginBottom: 0 }}>
              <label>Bio</label>
              <textarea className="pw-input pw-textarea" rows={3} placeholder="Tell readers about yourself" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>

          <div className="pw-settings-row">
            <div className="pw-settings-row-label"><strong>Email</strong><span>{form.email}</span></div>
          </div>

          <div className="pw-settings-row">
            <div className="pw-settings-row-label"><strong>Date of birth</strong><span>{form.dob || 'Not set'}</span></div>
          </div>

          <div className="pw-settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="pw-field" style={{ marginBottom: 0 }}>
              <label>Language</label>
              <select className="pw-input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                {['English', 'Español', 'Français', 'Deutsch'].map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="pw-settings-group">
          <h3>Your feed interests</h3>
          <div className="pw-settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="pw-interest-grid">
              {CATEGORIES.map(cat => (
                <button key={cat} className={`pw-interest-chip ${form.interests.includes(cat) ? 'picked' : ''}`} onClick={() => toggleInterest(cat)}>
                  {form.interests.includes(cat) && <Check size={14} />} {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pw-settings-group">
          <h3>AI assistant</h3>
          <div className="pw-settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="pw-settings-row-label"><strong>Preferred AI model</strong></div>
            <div style={{ marginTop: '10px' }}>
              {['ChatGPT', 'Claude', 'Grok'].map(p => (
                <button key={p} className={`pw-provider-chip ${aiProvider === p ? 'active' : ''}`} onClick={() => setAiProvider(p)}>
                  {aiProvider === p && <Check size={13} />} {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pw-settings-group">
          <h3>Notifications</h3>
          {[
            { key: 'breaking', label: 'Breaking news alerts', desc: 'Get notified when big stories break' },
            { key: 'comments', label: 'Comments & replies', desc: 'When someone responds to you' },
            { key: 'follows', label: 'New followers', desc: 'When someone follows your profile' },
            { key: 'email', label: 'Email digest', desc: 'A daily summary sent to your inbox' },
            { key: 'push', label: 'Push notifications', desc: 'Alerts on this device' },
          ].map(item => (
            <div className="pw-settings-row" key={item.key}>
              <div className="pw-settings-row-label"><strong>{item.label}</strong><span>{item.desc}</span></div>
              <Switch on={!!notif[item.key as keyof typeof notif]} onClick={() => setNotif(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notif] }))} />
            </div>
          ))}
        </div>

        <div className="pw-settings-group">
          <h3>Privacy</h3>
          {[
            { key: 'publicProfile', label: 'Public profile', desc: 'Allow others to find and follow you' },
            { key: 'searchIndex', label: 'Search indexing', desc: 'Show your profile in search results' },
            { key: 'messageRequests', label: 'Message requests', desc: 'Allow people to send you messages' },
          ].map(item => (
            <div className="pw-settings-row" key={item.key}>
              <div className="pw-settings-row-label"><strong>{item.label}</strong><span>{item.desc}</span></div>
              <Switch on={privacy[item.key as keyof typeof privacy]} onClick={() => setPrivacy(p => ({ ...p, [item.key]: !p[item.key as keyof typeof privacy] }))} />
            </div>
          ))}
        </div>

        <div className="pw-settings-group">
          <h3>Account</h3>
          <div className="pw-settings-row">
            <div className="pw-settings-row-label"><strong className="pw-settings-danger">Log out</strong><span>You'll return to the login page</span></div>
            <button className="pw-ghost-btn" onClick={handleLogout}><LogOut size={14} /> Log out</button>
          </div>
        </div>
      </div>
    </div>
  );
}

