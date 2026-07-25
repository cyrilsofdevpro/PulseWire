import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps, NextPage } from 'next';
import { isAdminAuthenticated } from '../../../lib/adminAuth';

const AdminLoginPage: NextPage = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Unable to sign in.');
      return;
    }

    router.replace('/pulsewire/admin');
  };

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="kicker">PulseWire Admin</div>
        <h1>Owner access</h1>
        <p>Enter the server-side admin password to continue.</p>
        <form onSubmit={handleSubmit}>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Admin password" autoComplete="current-password" />
          {error ? <div className="error">{error}</div> : null}
          <button type="submit" disabled={loading}>{loading ? 'Checking…' : 'Enter dashboard'}</button>
        </form>
      </div>
      <style jsx global>{`
        body { margin: 0; background: linear-gradient(135deg, #07111d 0%, #0f1d2e 100%); font-family: Inter, ui-sans-serif, system-ui; color: #f7fbff; }
        .admin-login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
        .admin-login-card { width: min(100%, 480px); padding: 32px; border-radius: 24px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); box-shadow: 0 24px 60px rgba(0,0,0,0.25); }
        .admin-login-card h1 { font-size: 28px; margin: 6px 0 8px; }
        .admin-login-card p { color: #8fa6bc; margin-bottom: 18px; }
        .admin-login-card form { display: flex; flex-direction: column; gap: 12px; }
        .admin-login-card input { padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; }
        .admin-login-card button { padding: 12px 14px; border-radius: 12px; border: none; cursor: pointer; color: white; background: linear-gradient(135deg, #09c8a2, #2f7bff); font-weight: 700; }
        .error { color: #ff8d8d; font-size: 13px; }
        .kicker { color: #5ce1c7; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; }
      `}</style>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (isAdminAuthenticated(context.req)) {
    return {
      redirect: {
        destination: '/pulsewire/admin',
        permanent: false
      }
    };
  }

  return { props: {} };
};

export default AdminLoginPage;
