import React from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, Sparkles, ShieldCheck, Star, Globe } from 'lucide-react'

const styles = `
:root { --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230; --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6; --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D; --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09); --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673; --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB; --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35); }
* { box-sizing: border-box; }
body { margin: 0; }
.pw-pricing-page { min-height:100vh; background:var(--ink); color:var(--text-d1); font-family:Inter,sans-serif; padding:28px 24px 80px; }
.pw-pricing-shell { max-width:1080px; margin:0 auto; }
.pw-pricing-header { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:28px; }
.pw-pricing-tag { display:inline-flex; align-items:center; gap:8px; font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--wire); font-weight:700; }
.pw-pricing-title { margin:0; font-size:42px; line-height:1.05; }
.pw-pricing-copy { max-width:640px; color:var(--text-d2); font-size:16px; line-height:1.75; }
.pw-pricing-nav { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.pw-btn-primary, .pw-btn-secondary { border:none; border-radius:100px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:8px; }
.pw-btn-primary { background:var(--wire); color:#04241f; padding:14px 22px; }
.pw-btn-secondary { background:transparent; color:var(--text-d1); border:1px solid var(--border-dark); padding:14px 22px; }
.pw-plan-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; margin-top:36px; }
.pw-plan-card { background:var(--ink-raised); border:1px solid var(--border-dark); border-radius:var(--radius); padding:26px; min-height:420px; display:flex; flex-direction:column; justify-content:space-between; }
.pw-plan-card.popular { border-color:var(--wire); box-shadow:0 18px 40px -22px rgba(0,217,184,.8); }
.pw-plan-label { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--wire); font-weight:700; margin-bottom:16px; }
.pw-plan-title { font-size:24px; margin:0 0 12px; }
.pw-plan-price { font-size:40px; margin:0 0 8px; }
.pw-plan-note { color:var(--text-d2); font-size:13px; margin:0 0 22px; }
.pw-plan-benefits { list-style:none; padding:0; margin:0; display:grid; gap:12px; flex:1; }
.pw-plan-benefits li { display:flex; align-items:flex-start; gap:12px; color:var(--text-d2); font-size:14px; line-height:1.65; }
.pw-plan-benefits li svg { margin-top:4px; color:var(--wire); min-width:18px; }
.pw-plan-cta { margin-top:22px; }
.pw-benefit-block { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:44px; }
.pw-benefit-card { background:var(--ink-raised); border:1px solid var(--border-dark); border-radius:var(--radius); padding:22px; }
.pw-benefit-card h3 { font-size:18px; margin:0 0 10px; }
.pw-benefit-card p { margin:0; color:var(--text-d2); line-height:1.7; }
@media (max-width:1000px){ .pw-plan-grid { grid-template-columns:1fr; } .pw-benefit-block { grid-template-columns:1fr; } }
@media (max-width:680px){ .pw-pricing-page { padding:22px 16px 60px; } .pw-pricing-title { font-size:32px; } }
`

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="pw-pricing-page">
      <style jsx>{styles}</style>
      <div className="pw-pricing-shell">
        <div className="pw-pricing-header">
          <div>
            <div className="pw-pricing-tag"><Sparkles size={14} /> PulseWire Premium</div>
            <h1 className="pw-pricing-title">Supercharge your newsroom with AI-first premium tools.</h1>
            <p className="pw-pricing-copy">Unlock faster story creation, AI metadata workflows, exclusive briefing and prediction tools, and advanced content publishing controls for your newsroom.</p>
          </div>
          <div className="pw-pricing-nav">
            <button className="pw-btn-secondary" onClick={() => router.push('/pulsewire')}><ArrowLeft size={16} /> Back to feed</button>
            <button className="pw-btn-primary" onClick={() => router.push('/ai')}>Open AI workspace</button>
          </div>
        </div>

        <div className="pw-plan-grid">
          <article className="pw-plan-card">
            <div>
              <div className="pw-plan-label">Free</div>
              <h2 className="pw-plan-title">Free access</h2>
              <p className="pw-plan-price">$0</p>
              <p className="pw-plan-note">Basic newsroom access with standard article browsing, feed, and community features.</p>
              <ul className="pw-plan-benefits">
                <li><Star size={18} /> Read stories, save posts, and connect with the PulseWire community.</li>
                <li><Star size={18} /> Use core AI search and questions in the workspace.</li>
                <li><Star size={18} /> View basic story summaries and trending topics.</li>
                <li><Star size={18} /> Access the feed and profile dashboard.</li>
              </ul>
            </div>
            <div className="pw-plan-cta">
              <button className="pw-btn-secondary" onClick={() => router.push('/register')}>Create account</button>
            </div>
          </article>

          <article className="pw-plan-card popular">
            <div>
              <div className="pw-plan-label">Most popular</div>
              <h2 className="pw-plan-title">PulseWire Pro</h2>
              <p className="pw-plan-price">$15 lifetime</p>
              <p className="pw-plan-note">Premium AI workflows and newsroom automation for creators, writers, and teams.</p>
              <ul className="pw-plan-benefits">
                <li><Star size={18} /> Creator AI Studio with drafts, headlines, rewrites, SEO, and social copy.</li>
                <li><Star size={18} /> Daily AI Briefings, Community Predictions, and Podcast script generation.</li>
                <li><Star size={18} /> NewsData importer with metadata generation and story storage.</li>
                <li><Star size={18} /> Priority AI performance and provider-agnostic Gemini-first routing.</li>
              </ul>
            </div>
            <div className="pw-plan-cta">
              <button className="pw-btn-primary" onClick={() => router.push('/confirm-payment')}>Upgrade to Pro</button>
            </div>
          </article>

          <article className="pw-plan-card">
            <div>
              <div className="pw-plan-label">Enterprise</div>
              <h2 className="pw-plan-title">Custom newsroom</h2>
              <p className="pw-plan-price">Contact us</p>
              <p className="pw-plan-note">Bespoke AI pipeline, premium ingestion, and advanced team access for newsroom operations.</p>
              <ul className="pw-plan-benefits">
                <li><Star size={18} /> Custom dataset onboarding and AI metadata rules.</li>
                <li><Star size={18} /> Enhanced notifications, alerts, and premium analytics.</li>
                <li><Star size={18} /> Dedicated support for editorial workflows and publishing.</li>
                <li><Star size={18} /> Enterprise-grade content governance and policy tools.</li>
              </ul>
            </div>
            <div className="pw-plan-cta">
              <button className="pw-btn-secondary" onClick={() => window.location.assign('mailto:sales@pulsewire.news')}>Contact sales</button>
              <button className="pw-btn-secondary" onClick={() => window.location.assign('/confirm-payment')}>Confirm payment</button>
            </div>
          </article>
        </div>

        <div className="pw-benefit-block">
          <section className="pw-benefit-card">
            <h3><Sparkles size={18} /> PulseWireAI workflows</h3>
            <p>PulseWire uses PulseWireAI as the priority provider with reliable fallback support, making sure AI-powered summaries, headlines, and story metadata generation stay available when you need them.</p>
          </section>
          <section className="pw-benefit-card">
            <h3><ShieldCheck size={18} /> Premium access control</h3>
            <p>Free users can explore core news tools, while PulseWire Pro unlocks Creator Studio, briefings, predictions, and premium news ingestion features in the AI workspace.</p>
          </section>
          <section className="pw-benefit-card">
            <h3><Globe size={18} /> Auto news pipeline</h3>
            <p>Imported stories are enriched with AI-generated metadata and stored for fast editorial search, so you can scale coverage with smarter content discovery.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
