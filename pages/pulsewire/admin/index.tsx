import { useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import AdminShell, { type AdminSection } from '../../../components/AdminShell';
import { useRouter } from 'next/router';
import { isAdminAuthenticated } from '../../../lib/adminAuth';
import { formatMetric, getAdminDashboardStats } from '../../../lib/adminStats';

type AdminDashboardProps = {
  stats: ReturnType<typeof getAdminDashboardStats> extends Promise<infer T> ? T : never;
};

const AdminDashboard: NextPage<AdminDashboardProps> = ({ stats }) => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [aiQuestion, setAiQuestion] = useState('How many users do we have?');
  const [aiLoading, setAiLoading] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('PulseWire update');
  const [broadcastMessage, setBroadcastMessage] = useState('We are rolling out a new update across PulseWire to keep the platform faster and more useful for the community.');
  const [broadcastAudience, setBroadcastAudience] = useState('all');
  const [broadcastTone, setBroadcastTone] = useState('professional');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Ask me about users, posts, news, comments, revenue, or active accounts and I will answer from the live admin metrics.' }
  ]);

  const metrics = [
    { label: 'Total users', value: formatMetric(stats.totalUsers), trend: `${stats.newUsersToday > 0 ? '+' : ''}${stats.newUsersToday} today` },
    { label: 'Premium subscribers', value: formatMetric(stats.premiumSubscribers), trend: `${stats.premiumSubscribers > 0 ? '+' : ''}${stats.premiumSubscribers} active` },
    { label: 'Published articles', value: formatMetric(stats.publishedArticles), trend: `${stats.breakingNewsPublished} breaking` },
    { label: 'Pending payments', value: formatMetric(stats.pendingPayments || 0), trend: '' },
    { label: 'Creator posts', value: formatMetric(stats.totalPosts), trend: `${stats.totalArticles} news items` }
  ];

  const activity = [
    { title: 'Breaking news published', detail: `${stats.breakingNewsPublished} new stories synced` },
    { title: 'AI-generated summaries', detail: `${stats.aiGeneratedArticles} articles enhanced` },
    { title: 'Community activity', detail: `${stats.totalComments} comments captured` }
  ];

  const askAdminAi = async () => {
    const trimmed = aiQuestion.trim();
    if (!trimmed) return;

    setAiMessages((current) => [...current, { role: 'user', content: trimmed }]);
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, stats })
      });
      const payload = await res.json();
      setAiMessages((current) => [...current, { role: 'assistant', content: payload.answer || 'I could not answer that request right now.' }]);
      setAiQuestion('');
    } catch (error) {
      setAiMessages((current) => [...current, { role: 'assistant', content: 'The AI assistant was unavailable. Please try again in a moment.' }]);
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const draftBroadcast = async (mode: 'draft' | 'send' = 'draft') => {
    const trimmedTitle = broadcastTitle.trim();
    const trimmedMessage = broadcastMessage.trim();
    if (!trimmedTitle && !trimmedMessage) return;

    setBroadcastLoading(true);
    setBroadcastStatus('');

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          title: trimmedTitle,
          message: trimmedMessage,
          audience: broadcastAudience,
          tone: broadcastTone,
          stats,
        })
      });
      const payload = await res.json();

      if (mode === 'draft') {
        setBroadcastMessage(payload.draft || trimmedMessage);
        setBroadcastStatus('Draft updated with AI assistance.');
      } else {
        setBroadcastStatus(payload.saved ? 'Broadcast sent and saved to the notification stream.' : 'Broadcast drafted locally.');
      }
    } catch (error) {
      console.error(error);
      setBroadcastStatus('The broadcast service is unavailable right now.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'revenue':
        return (
          <div className="grid panel-grid">
            <div className="card">
              <div className="kicker">Revenue</div>
              <h3 style={{ margin: '8px 0 10px' }}>Revenue overview</h3>
              <div className="list" style={{ marginTop: 10 }}>
                <div className="list-row"><span>Total revenue</span><strong>{formatMetric(stats.totalRevenue || 0)}</strong></div>
                <div className="list-row"><span>Monthly revenue</span><strong>{formatMetric(stats.monthlyRevenue || 0)}</strong></div>
                <div className="list-row"><span>Current revenue</span><strong>{formatMetric(stats.revenue || 0)}</strong></div>
                <div className="list-row"><span>Creator posts</span><strong>{formatMetric(stats.totalPosts)}</strong></div>
              </div>
            </div>
            <div className="card">
              <div className="kicker">Growth</div>
              <h3 style={{ margin: '8px 0 10px' }}>Live business signal</h3>
              <p style={{ color: '#8ca0b3', lineHeight: 1.7 }}>
                The admin panel now shows revenue alongside content volume so the team can spot what is driving growth and where to invest next.
              </p>
              <div className="pill">Revenue-ready</div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="grid panel-grid">
            <div className="card">
              <div className="kicker">AI assistant</div>
              <h3 style={{ margin: '8px 0 10px' }}>Ask the admin AI</h3>
              <div className="ai-input-row" style={{ marginBottom: 12 }}>
                <input
                  value={aiQuestion}
                  onChange={(event) => setAiQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      askAdminAi();
                    }
                  }}
                  placeholder="How many users do we have?"
                />
                <button className="primary-btn" type="button" onClick={askAdminAi} disabled={aiLoading}>
                  {aiLoading ? 'Thinking…' : 'Ask AI'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {['How many users do we have?', 'How many posts are active?', 'Show me the published news count'].map((example) => (
                  <button key={example} className="ai-example" type="button" onClick={() => setAiQuestion(example)}>
                    {example}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {aiMessages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`ai-bubble ${message.role === 'user' ? 'user' : ''}`}>
                    {message.content}
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="kicker">Live numbers</div>
              <h3 style={{ margin: '8px 0 10px' }}>Current platform snapshot</h3>
              <div className="list">
                <div className="list-row"><span>Users</span><strong>{formatMetric(stats.totalUsers)}</strong></div>
                <div className="list-row"><span>Active users</span><strong>{formatMetric(stats.activeUsers)}</strong></div>
                <div className="list-row"><span>Posts</span><strong>{formatMetric(stats.totalPosts)}</strong></div>
                <div className="list-row"><span>News articles</span><strong>{formatMetric(stats.totalArticles)}</strong></div>
                <div className="list-row"><span>Published news</span><strong>{formatMetric(stats.publishedArticles)}</strong></div>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="card">
            <div className="kicker">Users</div>
            <h3 style={{ margin: '8px 0 10px' }}>User overview</h3>
            <div className="list">
              <div className="list-row"><span>Total users</span><strong>{formatMetric(stats.totalUsers)}</strong></div>
              <div className="list-row"><span>New today</span><strong>{formatMetric(stats.newUsersToday)}</strong></div>
              <div className="list-row"><span>Active users</span><strong>{formatMetric(stats.activeUsers)}</strong></div>
              <div className="list-row"><span>Premium</span><strong>{formatMetric(stats.premiumSubscribers)}</strong></div>
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="card">
            <div className="kicker">Content</div>
            <h3 style={{ margin: '8px 0 10px' }}>Content overview</h3>
            <div className="list">
              <div className="list-row"><span>Creator posts</span><strong>{formatMetric(stats.totalPosts)}</strong></div>
              <div className="list-row"><span>News articles</span><strong>{formatMetric(stats.totalArticles)}</strong></div>
              <div className="list-row"><span>Published news</span><strong>{formatMetric(stats.publishedArticles)}</strong></div>
              <div className="list-row"><span>Draft articles</span><strong>{formatMetric(stats.draftArticles)}</strong></div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="grid panel-grid">
            <div className="card">
              <div className="kicker">Broadcast</div>
              <h3 style={{ margin: '8px 0 10px' }}>Send a platform update</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={broadcastTitle} onChange={(event) => setBroadcastTitle(event.target.value)} placeholder="Headline" />
                <select value={broadcastAudience} onChange={(event) => setBroadcastAudience(event.target.value)}>
                  <option value="all">All users</option>
                  <option value="premium">Premium subscribers</option>
                  <option value="creators">Creators</option>
                </select>
                <select value={broadcastTone} onChange={(event) => setBroadcastTone(event.target.value)}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="urgent">Urgent</option>
                </select>
                <textarea value={broadcastMessage} onChange={(event) => setBroadcastMessage(event.target.value)} rows={6} placeholder="Write the announcement here" />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="ghost-btn" type="button" onClick={() => draftBroadcast('draft')} disabled={broadcastLoading}>
                    {broadcastLoading ? 'Drafting…' : 'Draft with AI'}
                  </button>
                  <button className="primary-btn" type="button" onClick={() => draftBroadcast('send')} disabled={broadcastLoading}>
                    {broadcastLoading ? 'Sending…' : 'Send broadcast'}
                  </button>
                </div>
                {broadcastStatus ? <div className="pill" style={{ alignSelf: 'flex-start' }}>{broadcastStatus}</div> : null}
              </div>
            </div>
            <div className="card">
              <div className="kicker">AI assist</div>
              <h3 style={{ margin: '8px 0 10px' }}>What the assistant uses</h3>
              <p style={{ color: '#8ca0b3', lineHeight: 1.7 }}>
                Broadcasts are drafted from live platform metrics so your announcements are timely, polished, and relevant to current growth.
              </p>
              <div className="list" style={{ marginTop: 10 }}>
                <div className="list-row"><span>Audience</span><strong>{broadcastAudience}</strong></div>
                <div className="list-row"><span>Tone</span><strong>{broadcastTone}</strong></div>
                <div className="list-row"><span>Users</span><strong>{formatMetric(stats.totalUsers)}</strong></div>
              </div>
            </div>
          </div>
        );
      case 'overview':
      default:
        return (
          <>
            <div className="grid stats-grid">
              {metrics.map((item) => (
                <div className="card" key={item.label}>
                  <div className="metric-label">{item.label}</div>
                  <div className="metric-value">{item.value}</div>
                  <div className="metric-trend">{item.trend}</div>
                </div>
              ))}
            </div>

            <div className="grid panel-grid">
              <div className="card">
                <div className="kicker">Growth</div>
                <h3 style={{ margin: '8px 0 10px' }}>Performance snapshot</h3>
                <div className="bar-row"><span>Users</span><div className="bar"><i style={{ width: `${Math.min(100, stats.totalUsers > 0 ? 72 : 0)}%` }} /></div></div>
                <div className="bar-row"><span>Content</span><div className="bar"><i style={{ width: `${Math.min(100, Math.round((stats.publishedArticles / Math.max(stats.totalArticles, 1)) * 100) || 0)}%` }} /></div></div>
                <div className="bar-row"><span>Comments</span><div className="bar"><i style={{ width: `${Math.min(100, Math.round((stats.totalComments / Math.max(stats.totalUsers, 1)) * 100) || 0)}%` }} /></div></div>
                <div className="bar-row"><span>AI usage</span><div className="bar"><i style={{ width: `${Math.min(100, stats.aiGeneratedArticles > 0 ? 88 : 0)}%` }} /></div></div>
              </div>
              <div className="card">
                <div className="kicker">Assistant</div>
                <h3 style={{ margin: '8px 0 10px' }}>Live platform briefing</h3>
                <p style={{ color: '#8ca0b3', lineHeight: 1.7 }}>
                  The latest figures show {stats.activeUsers} active accounts, {stats.publishedArticles} published articles, and {stats.totalComments} comments flowing through the network.
                </p>
                <div className="pill">Insights ready</div>
              </div>
            </div>

            <div className="grid panel-grid">
              <div className="card">
                <div className="kicker">Recent activity</div>
                <div className="list" style={{ marginTop: 10 }}>
                  {activity.map((item) => (
                    <div className="list-row" key={item.title}>
                      <div>
                        <strong>{item.title}</strong>
                        <div style={{ color: '#86a0b7', fontSize: 13 }}>{item.detail}</div>
                      </div>
                      <span className="pill">Live</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="kicker">Operations</div>
                <div className="list" style={{ marginTop: 10 }}>
                  <div className="list-row"><span>Total posts</span><strong>{formatMetric(stats.totalPosts)}</strong></div>
                  <div className="list-row"><span>News articles</span><strong>{formatMetric(stats.totalArticles)}</strong></div>
                  <div className="list-row"><span>Breaking stories</span><strong>{formatMetric(stats.breakingNewsPublished)}</strong></div>
                  <div className="list-row"><span>Draft articles</span><strong>{formatMetric(stats.draftArticles)}</strong></div>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <AdminShell
      title={activeSection === 'revenue' ? 'Revenue' : activeSection === 'ai' ? 'AI assistant' : activeSection === 'users' ? 'Users' : activeSection === 'content' ? 'Content' : activeSection === 'settings' ? 'Settings' : 'Control center'}
      subtitle={activeSection === 'revenue' ? 'Track business health, monetization, and content output from one place.' : activeSection === 'ai' ? 'Ask about users, posts, news, comments, and revenue using the admin AI.' : activeSection === 'users' ? 'Monitor user growth, active accounts, and premium adoption.' : activeSection === 'content' ? 'Review posts, news content, and publishing progress.' : activeSection === 'settings' ? 'Manage the admin experience and security touchpoints.' : 'A polished, hidden admin surface for operations, growth, and AI oversight.'}
      activeSection={activeSection}
      onSectionChange={(s) => {
        if (s === 'payments') return router.push('/pulsewire/admin/payments')
        setActiveSection(s)
      }}
      stats={stats}
    >
      {renderSection()}
    </AdminShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!isAdminAuthenticated(context.req)) {
    return {
      redirect: {
        destination: '/pulsewire/admin/login',
        permanent: false
      }
    };
  }

  const stats = await getAdminDashboardStats();

  return { props: { stats } };
};

export default AdminDashboard;
