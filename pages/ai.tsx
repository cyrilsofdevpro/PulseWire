import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Languages, MessageSquare, Sparkles, Wand2 } from 'lucide-react';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import { getUpgradeMessage, isPremiumFeature } from '../lib/premium';

const CSS = `
:root{ --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
.pw-root{ background:var(--ink); color:var(--text-d1); min-height:100vh; width:100%; font-family:'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
.pw-root *{box-sizing:border-box;} .pw-root button{font-family:inherit; cursor:pointer;} .pw-root img{display:block; max-width:100%;}
.pw-topbar{position:sticky; top:0; z-index:50; backdrop-filter:blur(20px) saturate(180%); background:color-mix(in srgb, var(--ink) 78%, transparent); border-bottom:1px solid var(--border-dark); padding-top:env(safe-area-inset-top);}
.pw-topbar-inner{max-width:1240px; margin:0 auto; padding:14px 24px; display:flex; align-items:center; gap:24px;}
.pw-logo{display:flex; align-items:center; gap:10px; font-weight:700; font-size:19px; letter-spacing:-.02em;}
.pw-topbar-right{display:flex; align-items:center; gap:10px; margin-left:auto;}
.pw-nav-links{display:flex; gap:2px;}
.pw-nav-links button{padding:9px 14px; border-radius:100px; font-size:14px; font-weight:500; color:var(--text-d2); background:none; border:none; transition:.2s;}
.pw-nav-links button.active, .pw-nav-links button:hover{background:var(--ink-raised-2); color:var(--text-d1);}
.pw-btn-primary{background:var(--wire); color:#04241f; border:none; padding:13px 22px; border-radius:100px; font-weight:700; font-size:15px; display:inline-flex; align-items:center; gap:8px; transition:.2s;}
.pw-btn-secondary{background:transparent; border:1px solid var(--border-dark); color:var(--text-d1); padding:13px 22px; border-radius:100px; font-weight:600; font-size:15px;}
.pw-input{width:100%; background:var(--ink-raised); border:1px solid var(--border-dark); color:var(--text-d1); padding:13px 15px; border-radius:12px; font-size:15px; font-family:inherit; transition:.15s;}
.pw-input:focus{outline:none; border-color:var(--wire); box-shadow:0 0 0 3px color-mix(in srgb, var(--wire) 20%, transparent);}
.pw-field{margin-bottom:16px;}
.pw-field label{display:block; font-size:12.5px; font-weight:600; color:var(--text-d2); margin-bottom:7px;}
.pw-wrap{max-width:1240px; margin:0 auto; padding:32px 24px 120px;}
.pw-layout{display:grid; grid-template-columns:1fr 340px; gap:40px; align-items:start;}
.pw-side-card{border:1px solid var(--border-dark); border-radius:var(--radius); background:var(--ink-raised); padding:20px; margin-bottom:22px;}
.pw-ai-widget{background:linear-gradient(160deg,var(--ink-raised),var(--ink-raised-2)); border:1px solid var(--border-dark); border-radius:var(--radius); padding:22px;}
.pw-ai-toolbar{display:flex; gap:8px; overflow-x:auto; padding:16px 0 20px; border-bottom:1px solid var(--border-dark); margin-bottom:24px;}
.pw-ai-pill{flex-shrink:0; display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:100px; font-size:12.5px; font-weight:600; border:1px solid var(--border-dark); background:var(--ink-raised); color:var(--text-d2); white-space:nowrap; transition:.2s;}
.pw-ai-pill.active{background:var(--wire); color:#04241f; border-color:transparent;}
.pw-ai-pill.locked{opacity:.5; cursor:not-allowed;}
.pw-ai-pill svg{color:inherit;}
.pw-stack{display:grid; gap:12px;}
.pw-message{border:1px solid var(--border-dark); background:var(--ink-raised-2); border-radius:14px; padding:12px; color:var(--text-d1); font-size:13.5px; line-height:1.55;}
.pw-message strong{display:block; margin-bottom:5px; color:var(--wire);}
.pw-plan-banner{display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:18px; padding:12px 14px; border-radius:14px; background:rgba(0,217,184,.12); border:1px solid rgba(0,217,184,.2); color:var(--text-d1);}
.pw-plan-banner strong{color:var(--wire);}
.pw-hero-title{font-size:32px; margin:0 0 12px; letter-spacing:-.02em;}
.pw-hero-copy{color:var(--text-d2); margin:0 0 24px; font-size:16px; line-height:1.6;}
.pw-grid-2{display:grid; grid-template-columns:1fr 1fr; gap:16px;}
.pw-list{margin:0; padding-left:18px; color:var(--text-d2); font-size:13.5px; line-height:1.6;}
@media (max-width:980px){ .pw-layout{grid-template-columns:1fr;} }
@media (max-width:768px){ .pw-nav-links,.pw-topbar-right .pw-btn-secondary{display:none;} .pw-topbar-inner{padding:12px 16px;} .pw-wrap{padding:20px 16px 110px;} .pw-grid-2{grid-template-columns:1fr;} .pw-ai-header-mobile{display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px;} .pw-ai-header-mobile .pw-btn-secondary{width:100%; justify-content:center;} }
@media (min-width:769px){ .pw-ai-header-mobile{display:none;} }
`;

function LogoMark({ size = 26, color = 'var(--wire)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="12" stroke={color} strokeWidth="1.4" />
      <path d="M4 13h4l2-6 3 12 2.5-9 1.5 3h5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PulseWireAiPage() {
  const [prompt, setPrompt] = useState('Summarize the latest PulseWire story in two sentences.');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<'chat' | 'summarize' | 'translate' | 'draft' | 'headline' | 'rewrite' | 'grammar' | 'seo' | 'social' | 'brainstorm' | 'briefing' | 'predictions' | 'podcast'>('chat');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const { plan, loading: premiumLoading, isPro } = usePremiumAccess();
  const isLocked = isPremiumFeature(activeTool) && !isPro;
  const premiumBanner = premiumLoading
    ? 'Loading subscription status…'
    : isLocked
      ? getUpgradeMessage(activeTool)
      : `Current plan: ${plan === 'enterprise' ? 'Enterprise' : plan === 'pro' ? 'PulseWire Pro' : 'Free'}.`;

  const features = useMemo(() => [
    'Creator AI Studio tools for headlines, rewrites, grammar, SEO, social posts, and brainstorms',
    'Daily newsroom briefings and community prediction prompts',
    'AI podcast script and story idea generation in one tool',
    'Provider-agnostic backend with PulseWireAI-first fallback support',
  ], []);

  const toolLabel = {
    chat: 'Ask AI',
    summarize: 'Summarize',
    translate: 'Translate',
    draft: 'Draft',
    headline: 'Headline',
    rewrite: 'Rewrite',
    grammar: 'Grammar',
    seo: 'SEO',
    social: 'Social',
    brainstorm: 'Studio',
    briefing: 'Briefing',
    predictions: 'Predictions',
    podcast: 'Podcast',
  } as const;

  const toolHelp = {
    chat: 'Ask a question about news, trends, or a story draft.',
    summarize: 'Paste an article or excerpt and get a concise summary.',
    translate: 'Translate text into another language while keeping the tone.',
    draft: 'Ask AI to help improve the clarity and flow of your writing.',
    headline: 'Generate headline variations for a story.',
    rewrite: 'Rewrite text for clarity and audience impact.',
    grammar: 'Proofread and polish your copy.',
    seo: 'Create SEO metadata and keyword suggestions.',
    social: 'Generate social copy and teaser hooks.',
    brainstorm: 'Brainstorm story ideas and fresh angles.',
    briefing: 'Build a concise daily briefing on a topic.',
    predictions: 'Draft community predictions for a trend.',
    podcast: 'Write a short AI news podcast script.',
  } as const;

  const toolPlaceholder = {
    chat: 'Ask PulseWireAI a question about a story or trend...',
    summarize: 'Paste the story text you want summarized...',
    translate: 'Paste the text you want translated...',
    draft: 'Paste your draft or message for editing...',
    headline: 'Paste the story text for headline ideas...',
    rewrite: 'Paste the article text to rewrite...',
    grammar: 'Paste copy to proofread and polish...',
    seo: 'Paste the story text for SEO recommendations...',
    social: 'Paste the story text for social media copy...',
    brainstorm: 'Enter a topic to brainstorm story ideas...',
    briefing: 'Enter a topic for the daily AI briefing...',
    predictions: 'Enter a theme for community predictions...',
    podcast: 'Enter a topic for the AI news podcast script...',
  } as const;

  async function send(tool: typeof activeTool) {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    if (isPremiumFeature(tool) && !isPro) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `The ${toolLabel[tool]} tool is a PulseWire Pro feature. ${getUpgradeMessage(tool)}`,
        },
      ]);
      return;
    }

    setActiveTool(tool);
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const body: any = { tool };
      if (tool === 'chat') {
        body.question = trimmed;
      } else if (tool === 'translate') {
        body.text = trimmed;
        body.targetLanguage = targetLanguage;
      } else if (tool === 'briefing' || tool === 'predictions' || tool === 'podcast') {
        body.topic = trimmed;
      } else {
        body.text = trimmed;
      }

      const response = await fetch('/api/ai/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      const text =
        result.answer ||
        result.summary ||
        result.translation ||
        result.briefing ||
        result.predictions ||
        result.podcast ||
        result.headline ||
        result.rewritten ||
        result.corrected ||
        result.seo ||
        result.social ||
        result.brainstorm ||
        result.explanation ||
        result.sentiment ||
        result.result ||
        'I could not generate an AI response right now.';

      setMessages((prev) => [...prev, { role: 'assistant', text }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, the AI is unavailable right now. Try again in a moment.' }]);
    } finally {
      setLoading(false);
      setPrompt('');
    }
  }

  return (
    <div className="pw-root">
      <style jsx>{CSS}</style>

      <header className="pw-topbar">
        <div className="pw-topbar-inner">
          <div className="pw-logo"><LogoMark />PulseWire</div>
          <nav className="pw-nav-links">
            <button onClick={() => window.location.assign('/')}>Home</button>
            <button className="active" onClick={() => window.location.assign('/ai')}>PulseWireAI</button>
          </nav>
          <div className="pw-topbar-right">
            <button className="pw-btn-secondary" onClick={() => window.location.assign('/dashboard')}>Back to dashboard</button>
          </div>
        </div>
      </header>

      <div className="pw-wrap">
        <div className="pw-layout">
          <main>
            <section className="pw-ai-widget">
              <div className="pw-ai-header-mobile">
                <button className="pw-btn-secondary" onClick={() => window.location.assign('/dashboard')}><ArrowLeft size={16} />Back</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--wire)', fontWeight: 700 }}>PulseWireAI</div>
                  <h1 className="pw-hero-title" style={{ marginTop: 8 }}>Your newsroom assistant, now on its own full page.</h1>
                  <p className="pw-hero-copy">Ask questions, summarize posts, translate stories, and build better drafts without leaving the app.</p>
                </div>
              </div>

              <div className="pw-ai-toolbar" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                {(['chat', 'summarize', 'translate', 'draft', 'headline', 'rewrite', 'grammar', 'seo', 'social', 'brainstorm', 'briefing', 'predictions', 'podcast'] as const).map((tool) => {
                  const locked = isPremiumFeature(tool) && !isPro
                  return (
                    <button
                      key={tool}
                      className={`pw-ai-pill ${activeTool === tool ? 'active' : ''} ${locked ? 'locked' : ''}`}
                      onClick={() => !locked && setActiveTool(tool)}
                      type="button"
                      title={locked ? getUpgradeMessage(tool) : toolLabel[tool]}
                    >
                      {tool === 'chat' && <MessageSquare size={13} />}
                      {tool === 'summarize' && <Sparkles size={13} />}
                      {tool === 'translate' && <Languages size={13} />}
                      {tool === 'draft' && <Wand2 size={13} />}
                      {tool === 'headline' && <Sparkles size={13} />}
                      {tool === 'rewrite' && <Wand2 size={13} />}
                      {tool === 'grammar' && <Languages size={13} />}
                      {tool === 'seo' && <ArrowRight size={13} />}
                      {tool === 'social' && <Sparkles size={13} />}
                      {tool === 'brainstorm' && <Wand2 size={13} />}
                      {tool === 'briefing' && <Sparkles size={13} />}
                      {tool === 'predictions' && <ArrowRight size={13} />}
                      {tool === 'podcast' && <MessageSquare size={13} />}
                      {toolLabel[tool]}
                    </button>
                  )
                })}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="pw-plan-banner">
                  <strong>{premiumLoading ? 'Checking plan…' : `Plan: ${plan === 'enterprise' ? 'Enterprise' : plan === 'pro' ? 'PulseWire Pro' : 'Free'}`}</strong>
                  <span>{premiumBanner}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--wire)', fontWeight: 700 }}>{toolLabel[activeTool]}</div>
                  <div style={{ color: 'var(--text-d2)', fontSize: 13 }}>{toolHelp[activeTool]}</div>
                </div>
                {activeTool === 'translate' ? (
                  <div className="pw-field">
                    <label>Target language</label>
                    <select className="pw-input" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)}>
                      {['Spanish', 'French', 'German', 'Chinese', 'Portuguese'].map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              <div className="pw-field">
                <label>Prompt</label>
                <textarea
                  className="pw-input"
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={toolPlaceholder[activeTool]}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="pw-btn-primary" onClick={() => send(activeTool)} disabled={loading}>{loading ? 'Thinking...' : `Run ${toolLabel[activeTool]}`}</button>
                <button className="pw-btn-secondary" onClick={() => setPrompt('Summarize the latest PulseWire story in two sentences.')}>Reset prompt</button>
                <button className="pw-btn-secondary" onClick={() => setMessages([])} type="button">Clear chat</button>
              </div>
            </section>

            <section className="pw-side-card">
              <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--wire)', fontWeight: 700, marginBottom: 10 }}>Recent AI output</div>
              <div className="pw-stack">
                {messages.length === 0 ? (
                  <div className="pw-message"><strong>PulseWireAI</strong> Try a summary, a translation, or ask it to tighten a draft.</div>
                ) : (
                  messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className="pw-message" style={{ borderColor: message.role === 'assistant' ? 'rgba(0, 217, 184, .4)' : 'rgba(255,255,255,.08)' }}>
                      <strong>{message.role === 'user' ? 'You' : 'PulseWireAI'}</strong>
                      {message.text}
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>

          <aside>
            <section className="pw-side-card">
              <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--wire)', fontWeight: 700, marginBottom: 12 }}>What PulseWireAI can do</div>
              <ul className="pw-list">
                {features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </section>

            <section className="pw-side-card">
              <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--wire)', fontWeight: 700, marginBottom: 12 }}>Quick start</div>
              <div className="pw-grid-2">
                <button className="pw-btn-primary" onClick={() => setPrompt('Translate this article into Spanish while keeping the headline tone.')}>Translate</button>
                <button className="pw-btn-secondary" onClick={() => setPrompt('Summarize the main facts and list the biggest risks or takeaways.')}>Summary</button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
