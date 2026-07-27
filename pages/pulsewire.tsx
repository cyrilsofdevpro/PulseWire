import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Bell, User, Home, Compass, Bookmark, Heart, Share2,
  Sparkles, Sun, Moon, X, Plus, ArrowRight, ArrowLeft, Check,
  TrendingUp, Volume2, ShieldCheck, Languages, MessageSquare, Settings as SettingsIcon,
  LogOut, ChevronRight, Menu
} from "lucide-react";
import { supabase, uploadFileToBucket } from "../lib/supabaseClient";
import { followUser, unfollowUser } from "../lib/follows";
import PulseWireAi from "../components/PulseWireAi";

/* ------------------------------------------------------------------ */
/*  Static content                                                     */
/* ------------------------------------------------------------------ */

type Article = {
  id: number
  cat: string
  img: string
  title: string
  excerpt: string
  author: string
  authorId?: string
  authorVerified?: boolean
  time: string
  read: string
  hero?: boolean
}

const CATEGORIES = [
  "Technology", "AI", "Business", "Finance", "Cryptocurrency", "Politics",
  "Sports", "Entertainment", "Health", "Education", "Science", "World News"
];

const ARTICLES = [
  { id: 1, cat: "World News", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=80",
    title: "Nations agree on shared framework for cross-border AI safety audits",
    excerpt: "Twenty-two countries sign a joint accord establishing common testing standards for frontier models.",
    author: "Amara Okonkwo", time: "12m ago", read: "4 min", hero: true },
  { id: 2, cat: "Technology", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=80",
    title: "Frontier labs converge on a shared benchmark for reasoning models",
    excerpt: "A new open evaluation suite is quickly becoming the industry reference point for comparing capability.",
    author: "Jonas Meir", time: "32m ago", read: "5 min" },
  { id: 3, cat: "Finance", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&q=80",
    title: "Gold climbs to fresh highs as traders brace for CPI",
    excerpt: "Spot prices pushed through key resistance overnight, with desks split on further room to run.",
    author: "Sade Bakare", time: "1h ago", read: "3 min" },
  { id: 4, cat: "Cryptocurrency", img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=700&q=80",
    title: "Stablecoin issuers face fresh reserve disclosure rules",
    excerpt: "Regulators in three jurisdictions move in tandem, tightening requirements on backing assets.",
    author: "Wren Castillo", time: "2h ago", read: "4 min" },
  { id: 5, cat: "Science", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=700&q=80",
    title: "Fusion startup reports record plasma confinement time",
    excerpt: "The milestone edges the sector closer to sustained net-positive energy output.",
    author: "Ken Ibrahim", time: "3h ago", read: "6 min" },
  { id: 6, cat: "Business", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=700&q=80",
    title: "Regional carriers bet on loyalty programs built on open ledgers",
    excerpt: "Executives say the shift trims settlement costs between partner airlines significantly.",
    author: "Tolu Adigun", time: "4h ago", read: "5 min" },
  { id: 7, cat: "Health", img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&q=80",
    title: "Long-awaited trial data backs once-weekly therapy",
    excerpt: "Late-stage results show meaningful improvement across the full patient cohort studied.",
    author: "Grace Owosu", time: "5h ago", read: "4 min" },
  { id: 8, cat: "AI", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=700&q=80",
    title: "Smaller models close the gap on everyday reasoning tasks",
    excerpt: "New distillation techniques let compact models match larger ones on common benchmarks.",
    author: "Priya Nair", time: "6h ago", read: "5 min" },
];

const TRUSTED_STATS = [
  { label: '250,000+ Articles', emoji: '📰' },
  { label: '50,000+ Readers', emoji: '👥' },
  { label: '120 Countries', emoji: '🌍' },
  { label: 'AI Powered', emoji: '🤖' },
  { label: '99.9% Uptime', emoji: '⭐' },
];

const FEATURE_NEWS = [
  { badge: 'Breaking', title: 'Ukraine peace talks enter crucial phase', detail: 'Live coverage, expert commentary, and verified sources.' },
  { badge: 'Trending', title: 'AI regulation heats up in Brussels', detail: 'How new rules could reshape generative news and search.' },
  { badge: 'Editor’s Pick', title: 'Top product launches this week', detail: 'A curated view of the stories that matter for creators.' },
  { badge: 'Most Read', title: 'Global markets react to Fed guidance', detail: 'What investors are watching and why it still matters.' },
];

const AI_FEATURES = [
  { icon: Sparkles, title: 'AI Summary', detail: 'Instantly condense articles into crisp key takeaways.' },
  { icon: Check, title: 'AI Writer', detail: 'Draft headlines, briefs, and social updates in seconds.' },
  { icon: Volume2, title: 'AI Podcast', detail: 'Spin up show scripts and audio summaries for your audience.' },
  { icon: Languages, title: 'AI Translation', detail: 'Transform stories into another language effortlessly.' },
  { icon: Search, title: 'Smart Search', detail: 'Ask natural-language questions and get focused answers.' },
  { icon: TrendingUp, title: 'Daily Briefing', detail: 'Get a crisp digest of tomorrow’s top stories.' },
  { icon: Compass, title: 'Auto Publish', detail: 'Push curated stories into your newsroom workflow.' },
  { icon: ShieldCheck, title: 'Creator Studio', detail: 'Manage drafts, assets, and brand-ready headlines.' },
];

const CATEGORY_TAGS = [
  { label: 'Technology', icon: Sparkles },
  { label: 'AI', icon: Compass },
  { label: 'Business', icon: TrendingUp },
  { label: 'Crypto', icon: ShieldCheck },
  { label: 'Politics', icon: Languages },
  { label: 'Sports', icon: Heart },
  { label: 'Health', icon: ShieldCheck },
  { label: 'Science', icon: Compass },
  { label: 'Entertainment', icon: Volume2 },
];

const WHY_CHOOSE_CARDS = [
  { title: 'Fast', description: 'News that loads instantly with AI context and live updates.', icon: ArrowRight },
  { title: 'AI Powered', description: 'Automatic summaries, insights, and story suggestions.', icon: Sparkles },
  { title: 'Global Coverage', description: 'From local beats to global briefs, all in one newsroom.', icon: Languages },
  { title: 'Secure', description: 'Privacy-first settings and trusted publisher standards.', icon: ShieldCheck },
  { title: 'Mobile Friendly', description: 'News optimized for every device with a smooth reading experience.', icon: Home },
  { title: 'Personalized', description: 'Your interests shape what appears in your daily briefing.', icon: Compass },
];

const PLANS = [
  { tier: 'Free', price: '$0', note: 'Core news feed and basic AI tools.', perks: ['Browse stories', 'Saved reads', 'Basic search'] },
  { tier: 'Pro', price: '$15/month', note: 'Premium newsroom automation for creators.', highlight: true, perks: ['AI summaries', 'Live ingest', 'Creator Studio', 'Daily briefing'] },
  { tier: 'Enterprise', price: 'Custom', note: 'Tailored newsroom solutions for teams.', perks: ['Team access', 'Custom pipelines', 'Dedicated support'] },
];

const TESTIMONIALS = [
  { name: 'Nia Mensah', role: 'Editorial Lead', quote: 'PulseWire keeps our newsroom ahead of the curve with AI summaries that our team actually uses.', rating: 5 },
  { name: 'Rohan Patel', role: 'Growth Editor', quote: 'The premium feed and daily briefing make onboarding new readers effortless.', rating: 5 },
  { name: 'Zoe Carter', role: 'Podcast Producer', quote: 'Generating episode scripts from news briefs has cut our prep time in half.', rating: 5 },
];

const FAQ_ITEMS = [
  { question: 'Is PulseWire free?', answer: 'Yes, core news discovery is free. Pro unlocks premium AI features, newsroom automation, and advanced summaries.' },
  { question: 'How does AI work?', answer: 'AI analyzes headlines, summaries, and user intent to deliver concise insights and relevant follow-up content.' },
  { question: 'Can I publish articles?', answer: 'Premium users can ingest curated stories and publish them into the newsroom workflow with one click.' },
  { question: 'How does Premium work?', answer: 'Premium gives you access to creator tools, live news ingestion, auto publish workflows, and AI-driven briefs.' },
];

const DOWNLOAD_ITEMS = [
  { platform: 'Android', label: 'Coming soon' },
  { platform: 'iPhone', label: 'Coming soon' },
];

/* ------------------------------------------------------------------ */
/*  Style sheet (kept as one template literal to avoid a build step)   */
/* ------------------------------------------------------------------ */

const CSS = `
:root{
  --ink:#0B0F14; --ink-raised:#131924; --ink-raised-2:#1A2230;
  --paper:#F7F5F0; --paper-raised:#FFFFFF; --paper-raised-2:#EFEDE6;
  --wire:#00D9B8; --wire-dim:#00A896; --alert:#FF3B30; --gold:#E8B24D;
  --border-dark:rgba(255,255,255,.08); --border-light:rgba(20,24,31,.09);
  --text-d1:#F3F4F1; --text-d2:#9BA3AF; --text-d3:#5C6673;
  --text-l1:#14181F; --text-l2:#5C6470; --text-l3:#9BA1AB;
  --radius:20px; --shadow:0 20px 60px -20px rgba(0,0,0,.35);
}
.pw-root[data-theme="dark"]{ --bg:var(--ink); --surface:var(--ink-raised); --surface-2:var(--ink-raised-2); --border:var(--border-dark); --t1:var(--text-d1); --t2:var(--text-d2); --t3:var(--text-d3); }
.pw-root[data-theme="light"]{ --bg:var(--paper); --surface:var(--paper-raised); --surface-2:var(--paper-raised-2); --border:var(--border-light); --t1:var(--text-l1); --t2:var(--text-l2); --t3:var(--text-l3); }
.pw-root{
  --pw-header-h: calc(70px + env(safe-area-inset-top));
  --pw-ticker-h: 42px;
  background:var(--bg); color:var(--t1); min-height:100vh; width:100%;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;
  transition:background .35s ease,color .35s ease; position:relative; overflow-x:hidden;
}
.pw-root *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}
.pw-serif{font-family:'Fraunces','Georgia',serif;}
.pw-root button{font-family:inherit; cursor:pointer;}
.pw-root img{display:block; max-width:100%;}
.pw-root ::selection{background:var(--wire); color:#04241f;}

/* ---------- Landing ---------- */
.pw-landing{max-width:1160px; margin:0 auto; padding:28px 24px 80px; width:100%;}
.pw-landing-nav{display:flex; align-items:center; justify-content:space-between; margin-bottom:70px; gap:16px; flex-wrap:wrap;}
.pw-logo{display:flex; align-items:center; gap:10px; font-weight:700; font-size:19px; letter-spacing:-.02em;}
.pw-landing-actions{display:flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:flex-end;}
.pw-landing-actions button{flex-shrink:0;}
.pw-mobile-menu-btn{display:none; background:transparent; border:none; color:var(--t1); width:40px; height:40px; border-radius:50%; align-items:center; justify-content:center;}
.pw-ghost-btn{background:transparent; border:1px solid var(--border); color:var(--t1); padding:10px 18px; border-radius:100px; font-weight:600; font-size:14px;}
.pw-hero{text-align:center; max-width:760px; margin:0 auto 56px;}
.pw-mobile-menu{display:none; flex-direction:column; gap:12px; margin-top:14px;}
.pw-mobile-menu.open{display:flex;}
.pw-hero .pw-eyebrow{display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color:var(--wire); background:var(--surface-2); border:1px solid var(--border); padding:7px 14px; border-radius:100px; margin-bottom:24px;}
.pw-hero h1{font-size:56px; line-height:1.06; letter-spacing:-.03em; margin:0 0 20px; font-weight:600;}
.pw-hero h1 em{font-style:normal; color:var(--wire);}
.pw-hero p{font-size:18px; line-height:1.6; color:var(--t2); max-width:52ch; margin:0 auto 34px;}
.pw-hero-ctas{display:flex; align-items:center; justify-content:center; gap:14px;}
.pw-btn-primary{background:var(--wire); color:#04241f; border:none; padding:14px 26px; border-radius:100px; font-weight:700; font-size:15px; display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:.2s;}
.pw-btn-primary:hover{background:var(--wire-dim); transform:translateY(-1px);}
.pw-btn-secondary{background:var(--surface); border:1px solid var(--border); color:var(--t1); padding:14px 26px; border-radius:100px; font-weight:600; font-size:15px; display:inline-flex; align-items:center; justify-content:center; gap:8px;}
.pw-hero-note{font-size:12.5px; color:var(--t3); margin-top:18px;}

.pw-preview{border:1px solid var(--border); border-radius:24px; overflow:hidden; background:var(--surface); box-shadow:var(--shadow); padding:18px; margin-bottom:90px;}
.pw-preview-grid{display:grid; grid-template-columns:1.3fr 1fr 1fr; gap:14px;}
.pw-preview-card{border-radius:16px; overflow:hidden; background:var(--surface-2); border:1px solid var(--border);}
.pw-preview-card img{width:100%; aspect-ratio:16/11; object-fit:cover;}
.pw-preview-card .pw-pc-body{padding:14px;}
.pw-preview-card h4{font-size:14px; margin:0 0 6px; line-height:1.3;}
.pw-preview-card span{font-size:11px; color:var(--t3);}

.pw-features{display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-bottom:90px;}
.pw-feature{border:1px solid var(--border); border-radius:var(--radius); background:var(--surface); padding:26px;}
.pw-feature .pw-ficon{width:40px; height:40px; border-radius:12px; background:var(--surface-2); display:flex; align-items:center; justify-content:center; color:var(--wire); margin-bottom:16px;}
.pw-feature h3{font-size:16px; margin:0 0 8px;}
.pw-feature p{font-size:13.5px; color:var(--t2); line-height:1.55; margin:0;}

.pw-cta-band{text-align:center; border:1px solid var(--border); border-radius:28px; padding:56px 24px; background:linear-gradient(160deg,var(--surface),var(--surface-2)); position:relative; overflow:hidden;}
.pw-cta-band::after{content:""; position:absolute; inset:0; background:radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--wire) 16%, transparent), transparent 65%); pointer-events:none;}
.pw-cta-band h2{font-size:32px; margin:0 0 14px; position:relative;}
.pw-cta-band p{color:var(--t2); margin:0 0 26px; position:relative;}

.pw-nav-link{border:none; background:transparent; color:var(--t1); padding:10px 14px; border-radius:999px; font-weight:600; transition:.2s;}
.pw-nav-link:hover{background:var(--surface-2);}

.pw-hero-section{display:grid; grid-template-columns:1.1fr .9fr; gap:34px; align-items:start; margin-bottom:90px;}
.pw-hero-copy{max-width:660px; min-width:0;}
.pw-hero-right{display:grid; gap:18px; min-width:0;}
.pw-hero-card{border-radius:24px; padding:24px; background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow);}
.pw-glow-card{background:linear-gradient(180deg, rgba(0,217,184,.16), var(--surface));}
.pw-card-small{background:var(--surface-2);}
.pw-card-label{display:inline-flex; align-items:center; gap:8px; color:var(--wire); font-size:11px; font-weight:700; text-transform:uppercase; margin-bottom:10px;}
.pw-command-bar{display:flex; gap:12px; align-items:center; background:var(--surface-2); border:1px solid var(--border); border-radius:100px; padding:12px 16px; margin-top:26px;}
.pw-command-bar input{flex:1; border:none; background:transparent; color:var(--t1); font-size:14px; min-width:0;}
.pw-command-bar input:focus{outline:none;}
.pw-command-answer{margin-top:16px; border:1px solid var(--border); border-radius:20px; padding:18px; background:var(--surface-2);}
.pw-command-answer strong{display:block; margin-bottom:8px;}

.pw-stat-grid{display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:16px; margin-bottom:70px;}
.pw-stat-card{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:22px; display:flex; align-items:center; gap:14px; min-width:0;}
.pw-stat-emoji{font-size:24px; flex-shrink:0;}

.pw-section{margin-bottom:70px;}
.pw-section-head{display:flex; flex-direction:column; gap:10px; margin-bottom:28px;}
.pw-section-head h2{font-size:32px; margin:0;}

.pw-feature-news-grid{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:18px;}
.pw-feature-news-card{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:22px; min-width:0;}
.pw-card-badge{display:inline-flex; align-items:center; gap:8px; color:var(--wire); font-size:11px; font-weight:700; text-transform:uppercase; margin-bottom:12px;}
.pw-feature-news-card h3{margin:0 0 10px;}
.pw-feature-news-card p{margin:0; color:var(--t2); line-height:1.7;}

.pw-feature-grid{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:18px;}
.pw-feature-card{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:24px; min-width:0;}
.pw-feature-card h4{margin:0 0 10px;}
.pw-feature-card p{margin:0; color:var(--t2); line-height:1.7;}

.pw-category-grid{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px;}
.pw-category-pill{border:1px solid var(--border); border-radius:18px; padding:14px 18px; background:var(--surface); color:var(--t1); display:inline-flex; align-items:center; gap:10px; font-weight:600; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}

.pw-why-grid{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:18px;}
.pw-why-card{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:24px; min-width:0;}
.pw-why-icon{width:44px; height:44px; border-radius:16px; display:flex; align-items:center; justify-content:center; background:var(--surface-2); color:var(--wire); margin-bottom:16px;}
.pw-why-card h4{margin:0 0 10px;}
.pw-why-card p{margin:0; color:var(--t2); line-height:1.7;}

.pw-studio-grid{display:grid; grid-template-columns:1fr; gap:18px; margin-bottom:24px;}
.pw-studio-cards{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:18px;}
.pw-studio-card{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:22px; min-width:0;}
.pw-studio-card h4{margin:0 0 10px;}
.pw-studio-card p{margin:0; color:var(--t2);}
.pw-studio-chat{background:linear-gradient(180deg, rgba(0,217,184,.1), var(--surface));}
.pw-studio-actions{display:flex; flex-wrap:wrap; gap:12px; margin-top:12px;}

.pw-preview-cards{display:grid; grid-template-columns:1.2fr .8fr; gap:18px;}
.pw-preview-card-large{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:26px; min-width:0;}
.pw-preview-card-large h3{margin:0 0 8px;}
.pw-preview-card-large ul{padding-left:18px; margin:14px 0 10px; color:var(--t2);}
.pw-preview-card-large li{margin-bottom:8px;}
.pw-preview-meta{font-size:13px; color:var(--t3);}
.pw-preview-podcast{display:flex; flex-direction:column; justify-content:space-between;}
.pw-podcast-header{display:flex; justify-content:space-between; gap:14px; align-items:flex-start; margin-bottom:20px; flex-wrap:wrap;}
.pw-wave{height:100px; border-radius:24px; background:linear-gradient(180deg, rgba(0,217,184,.12), rgba(255,255,255,.04)); position:relative; overflow:hidden;}
.pw-wave span{position:absolute; left:0; right:0; top:40%; height:24px; background:linear-gradient(90deg, transparent, rgba(0,217,184,.8), transparent); animation:pwWave 2.8s ease-in-out infinite;}
@keyframes pwWave{0%,100%{transform:translateX(-100%);}50%{transform:translateX(100%);}}

.pw-prediction-grid{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:18px;}
.pw-prediction-card, .pw-leaderboard-card{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:20px; min-width:0;}
.pw-leaderboard-card{display:flex; flex-direction:column; gap:10px;}

.pw-plans-grid{display:grid; gap:18px;}
.pw-plan-cards{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:18px;}
.pw-plan-card{background:var(--surface); border:1px solid var(--border); border-radius:28px; padding:28px; display:flex; flex-direction:column; gap:16px; min-width:0;}
.pw-plan-card.highlight{border-color:var(--wire); box-shadow:0 20px 50px rgba(0,217,184,.12);}
.pw-plan-label{font-size:12px; text-transform:uppercase; color:var(--wire); font-weight:700;}
.pw-plan-card strong{font-size:32px; display:block;}
.pw-plan-card ul{padding-left:18px; margin:0; color:var(--t2);}
.pw-plan-card li{margin-bottom:8px;}

.pw-testimonial-grid{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:18px;}
.pw-testimonial-card{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:24px; display:flex; flex-direction:column; gap:16px; min-width:0;}
.pw-testimonial-profile{display:flex; align-items:center; gap:14px;}
.pw-testimonial-profile strong{display:block;}
.pw-testimonial-profile span{font-size:13px; color:var(--t2);}
.pw-stars{display:flex; gap:4px; color:#F7C948;}

.pw-faq-list{display:grid; gap:14px;}
.pw-faq-item{background:var(--surface); border:1px solid var(--border); border-radius:20px; overflow:hidden;}
.pw-faq-item.open p{padding:18px 20px 22px;}
.pw-faq-question{width:100%; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:18px 20px; border:none; background:transparent; color:var(--t1); font-size:15px; font-weight:600; text-align:left;}
.pw-faq-item p{margin:0; color:var(--t2); line-height:1.7; display:block;}

.pw-download-grid{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:18px;}
.pw-download-card{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:22px; min-width:0;}
.pw-download-qr{background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:22px; display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:0;}
.pw-qr-placeholder{width:110px; height:110px; border-radius:22px; background:linear-gradient(135deg, rgba(0,217,184,.14), rgba(255,255,255,.05)); display:flex; align-items:center; justify-content:center; color:var(--t2); font-weight:700;}

.pw-newsletter{display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:center; padding:28px; border:1px solid var(--border); border-radius:28px; background:var(--surface);}
.pw-newsletter-copy h2{margin:0 0 8px;}
.pw-newsletter-form{display:flex; gap:12px;}
.pw-newsletter-form input{flex:1; min-width:0; padding:16px 18px; border-radius:16px; border:1px solid var(--border); background:var(--surface-2); color:var(--t1);}
.pw-newsletter-status{margin-top:12px; color:var(--wire);}

.pw-footer{display:grid; gap:24px; padding:44px 0 20px; border-top:1px solid var(--border);}
.pw-footer-links{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:32px;}
.pw-footer-links strong{display:block; margin-bottom:14px;}
.pw-footer-links nav{display:grid; gap:10px;}
.pw-footer-links a{color:var(--t2); text-decoration:none;}
.pw-footer-links a:hover{color:var(--t1);}
.pw-footer-copy{color:var(--t3);}

@media (max-width:1160px){.pw-hero-section{grid-template-columns:1fr;} .pw-preview-cards{grid-template-columns:1fr;} .pw-plan-cards{grid-template-columns:1fr;} .pw-testimonial-grid{grid-template-columns:1fr;} .pw-hero-right{grid-template-columns:1fr;} }
@media (max-width:860px){
  .pw-features{grid-template-columns:1fr;}
  .pw-preview-grid{grid-template-columns:1fr; }
  .pw-hero h1{font-size:36px;}
  .pw-landing-nav{margin-bottom:40px;}
  .pw-hero{margin-bottom:36px;}
}

/* ---------- Signup ---------- */
.pw-signup-wrap{min-height:100vh; display:flex; flex-direction:column; align-items:center; padding:env(safe-area-inset-top) 20px calc(env(safe-area-inset-bottom) + 20px); padding-top:40px;}
.pw-signup-card{width:100%; max-width:460px;}
.pw-progress{display:flex; gap:6px; margin-bottom:34px;}
.pw-progress i{flex:1; height:4px; border-radius:100px; background:var(--surface-2);}
.pw-progress i.done{background:var(--wire);}
.pw-signup-back{display:inline-flex; align-items:center; gap:6px; color:var(--t2); font-size:13.5px; font-weight:600; margin-bottom:22px; background:none; border:none;}
.pw-signup-card h2{font-size:26px; margin:0 0 8px; letter-spacing:-.01em;}
.pw-signup-card > p{color:var(--t2); font-size:14.5px; margin:0 0 30px; line-height:1.5;}
.pw-field{margin-bottom:16px;}
.pw-field label{display:block; font-size:12.5px; font-weight:600; color:var(--t2); margin-bottom:7px;}
.pw-row2{display:grid; grid-template-columns:1fr 1fr; gap:12px;}
.pw-input{
  width:100%; background:var(--surface); border:1px solid var(--border); color:var(--t1);
  padding:13px 15px; border-radius:12px; font-size:15px; font-family:inherit; transition:.15s;
}
.pw-input:focus{outline:none; border-color:var(--wire); box-shadow:0 0 0 3px color-mix(in srgb, var(--wire) 20%, transparent);}
.pw-input::placeholder{color:var(--t3);}
.pw-hint{font-size:11.5px; color:var(--t3); margin-top:6px;}
.pw-continue{width:100%; margin-top:12px;}
.pw-continue:disabled{opacity:.4; cursor:not-allowed;}
.pw-auth-alert{font-size:13px; color:var(--wire); background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:12px 14px; margin-top:14px; line-height:1.5;}

.pw-interest-grid{display:flex; flex-wrap:wrap; gap:10px; margin-bottom:8px;}
.pw-interest-chip{
  padding:11px 18px; border-radius:100px; border:1.5px solid var(--border); background:var(--surface);
  color:var(--t2); font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:7px; transition:.15s;
}
.pw-interest-chip.picked{background:var(--wire); border-color:var(--wire); color:#04241f;}
.pw-count-note{font-size:12.5px; color:var(--t3); margin:18px 0 4px;}

/* ---------- App shell (topbar, ticker, feed) ---------- */
.pw-topbar{position:fixed; top:0; left:0; right:0; z-index:60; backdrop-filter:blur(20px) saturate(180%); background:color-mix(in srgb, var(--bg) 95%, transparent); border-bottom:1px solid var(--border); padding-top:env(safe-area-inset-top);}
.pw-topbar-inner{max-width:1240px; margin:0 auto; padding:14px 24px; display:flex; align-items:center; gap:16px; min-height:70px;}
.pw-nav-links{display:flex; gap:2px; flex-shrink:0;}
.pw-nav-links button{padding:9px 14px; border-radius:100px; font-size:14px; font-weight:500; color:var(--t2); background:none; border:none; transition:.2s; white-space:nowrap;}
.pw-nav-links button.active, .pw-nav-links button:hover{background:var(--surface-2); color:var(--t1);}
.pw-topbar-search{display:flex; align-items:center; justify-content:center; width:auto; min-width:44px; border:none; background:transparent; padding:0; color:var(--t3); font-size:13.5px; flex-shrink:0;}
.pw-topbar-search button{width:40px; height:40px; border-radius:50%; border:1px solid var(--border); background:var(--surface); display:flex; align-items:center; justify-content:center; color:var(--t2);}
.pw-topbar-search button:hover{color:var(--wire); border-color:var(--wire);}
.pw-topbar-right{display:flex; align-items:center; gap:8px; margin-left:auto; flex-shrink:0;}
.pw-icon-btn{width:38px; height:38px; border-radius:50%; border:1px solid var(--border); background:var(--surface); display:flex; align-items:center; justify-content:center; color:var(--t2); position:relative; flex-shrink:0;}
.pw-icon-btn:hover{color:var(--wire); border-color:var(--wire);}
.pw-image-preview{display:flex; align-items:center; gap:12px; margin-top:12px; padding:12px; border:1px solid var(--border); border-radius:16px; background:var(--surface-2);}
.pw-image-preview span{font-size:13px; color:var(--t2);}
.pw-image-preview img{max-height:72px; border-radius:12px; object-fit:cover;}
.pw-dot-badge{position:absolute; top:8px; right:8px; width:7px; height:7px; border-radius:50%; background:var(--alert); border:2px solid var(--bg);}
.pw-theme-toggle{width:52px; height:30px; border-radius:100px; background:var(--surface-2); border:1px solid var(--border); position:relative; padding:2px; flex-shrink:0;}
.pw-theme-toggle .pw-knob{width:24px; height:24px; border-radius:50%; background:var(--wire); display:flex; align-items:center; justify-content:center; color:#04241f; transition:transform .3s cubic-bezier(.4,0,.2,1);}
.pw-theme-toggle.light .pw-knob{transform:translateX(22px);}
.pw-avatar{width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,var(--wire),var(--gold)); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:#04241f; flex-shrink:0;}

.pw-ticker{position:fixed; top:var(--pw-header-h); left:0; right:0; z-index:55; background:var(--ink); color:#fff; overflow:hidden; border-bottom:1px solid var(--border-dark);}
.pw-ticker-inner{display:flex; align-items:center; gap:16px; padding:9px 24px; max-width:1240px; margin:0 auto;}
.pw-ticker-tag{display:flex; align-items:center; gap:7px; background:var(--alert); color:#fff; font-size:11px; font-weight:700; letter-spacing:.06em; padding:5px 11px; border-radius:100px; flex-shrink:0; text-transform:uppercase;}
.pw-pulse-dot{width:6px; height:6px; border-radius:50%; background:#fff; animation:pwPulse 1.4s infinite;}
@keyframes pwPulse{0%,100%{opacity:1; transform:scale(1);} 50%{opacity:.4; transform:scale(.7);}}
.pw-ticker-track{flex:1; overflow:hidden; white-space:nowrap; min-width:0;}
.pw-ticker-scroll{display:inline-flex; gap:48px; animation:pwTickerScroll 30s linear infinite;}
.pw-ticker-scroll span{font-size:13.5px; color:#D7DBE0; font-weight:500;}
@keyframes pwTickerScroll{from{transform:translateX(0);} to{transform:translateX(-50%);}}

.pw-wrap{max-width:1240px; margin:0 auto; padding:calc(var(--pw-header-h) + var(--pw-ticker-h) + 24px) 24px 120px; width:100%;}
.pw-wrap.no-ticker{padding-top:calc(var(--pw-header-h) + 24px);}
.pw-layout{display:grid; grid-template-columns:1fr 340px; gap:40px;}
.pw-hero-post{display:grid; grid-template-columns:1.1fr .9fr; gap:32px; margin-bottom:44px; padding-bottom:40px; border-bottom:1px solid var(--border);}
.pw-hero-media{border-radius:var(--radius); overflow:hidden; aspect-ratio:16/11; position:relative; background:var(--surface-2); cursor:pointer;}
.pw-hero-media img{width:100%; height:100%; object-fit:cover;}
.pw-hero-media .pw-cat-chip{position:absolute; top:16px; left:16px;}
.pw-cat-chip{font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; background:var(--wire); color:#04241f; padding:5px 11px; border-radius:100px; display:inline-block;}
.pw-cat-chip.outline{background:transparent; border:1px solid var(--wire); color:var(--wire);}
.pw-ai-chip{display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:var(--t2); background:var(--surface-2); border:1px solid var(--border); padding:5px 10px; border-radius:100px;}
.pw-hero-post h1{font-size:36px; line-height:1.1; letter-spacing:-.02em; margin:14px 0; font-weight:600; cursor:pointer;}
.pw-hero-post-content{display:flex; flex-direction:column; justify-content:center; min-width:0;}
.pw-dek{font-size:16.5px; line-height:1.6; color:var(--t2); margin:0 0 20px; max-width:52ch;}
.pw-byline{display:flex; align-items:center; gap:8px; font-size:13px; color:var(--t3); flex-wrap:wrap;}
.pw-byline .pw-name{color:var(--t1); font-weight:600;}
.pw-byline i{font-style:normal;}

.pw-pills{display:flex; gap:9px; overflow-x:auto; padding:2px 0 28px; -webkit-overflow-scrolling:touch;}
.pw-pill{flex-shrink:0; padding:9px 17px; border-radius:100px; font-size:13.5px; font-weight:600; border:1px solid var(--border); background:var(--surface); color:var(--t2); white-space:nowrap;}
.pw-pill.active{background:var(--t1); color:var(--bg); border-color:var(--t1);}

.pw-section-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:18px;}
.pw-section-head h2{font-size:14px; text-transform:uppercase; letter-spacing:.08em; font-weight:700; color:var(--t3); margin:0;}
.pw-feed-grid{display:grid; grid-template-columns:1fr 1fr; gap:22px;}
.pw-card{border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; background:var(--surface); transition:transform .3s, box-shadow .3s; cursor:pointer; min-width:0;}
.pw-card:hover{transform:translateY(-4px); box-shadow:var(--shadow);}
.pw-card-media{aspect-ratio:16/10; position:relative; overflow:hidden; background:var(--surface-2);}
.pw-card-media img{width:100%; height:100%; object-fit:cover;}
.pw-card-media .pw-cat-chip{position:absolute; top:12px; left:12px;}
.pw-card-body{padding:18px 18px 16px;}
.pw-card-body h3{font-size:18px; line-height:1.3; margin:0 0 8px; font-weight:600; letter-spacing:-.01em; overflow-wrap:anywhere;}
.pw-card-body p{font-size:13.5px; color:var(--t2); line-height:1.55; margin:0 0 14px; overflow-wrap:anywhere;}
.pw-card-meta{display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;}
.pw-meta-left{display:flex; align-items:center; gap:8px; font-size:12px; color:var(--t3); min-width:0;}
.pw-meta-left span{overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.pw-mini-avatar{width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--wire)); flex-shrink:0;}
.pw-actions{display:flex; gap:2px; flex-shrink:0;}
.pw-action-btn{width:32px; height:32px; border-radius:50%; border:none; background:transparent; color:var(--t3); display:flex; align-items:center; justify-content:center; flex-shrink:0;}
.pw-action-btn:hover{background:var(--surface-2); color:var(--t1);}
.pw-action-btn.liked{color:var(--alert);}
.pw-action-btn.saved{color:var(--gold);}

.pw-side-card{border:1px solid var(--border); border-radius:var(--radius); background:var(--surface); padding:20px; margin-bottom:22px;}
.pw-trend-item{display:flex; gap:14px; padding:12px 0; border-bottom:1px solid var(--border);}
.pw-trend-item:last-child{border-bottom:none; padding-bottom:0;}
.pw-trend-item:first-child{padding-top:0;}
.pw-trend-rank{font-family:'Fraunces',serif; font-size:22px; font-weight:600; color:var(--t3); width:22px; flex-shrink:0;}
.pw-trend-info{min-width:0;}
.pw-trend-info h4{font-size:14px; margin:0 0 4px; line-height:1.35; font-weight:600; overflow-wrap:anywhere;}
.pw-trend-info span{font-size:11.5px; color:var(--t3);}
.pw-ai-widget{background:linear-gradient(160deg,var(--surface),var(--surface-2)); border:1px solid var(--border); border-radius:var(--radius); padding:22px; margin-bottom:22px; position:relative; overflow:hidden;}
.pw-ai-widget h3{font-size:16px; margin:0 0 6px; display:flex; align-items:center; gap:8px;}
.pw-ai-widget p{font-size:13px; color:var(--t2); margin:0 0 16px; line-height:1.5;}

.pw-fab-container{position:fixed; right:20px; bottom:calc(88px + env(safe-area-inset-bottom)); z-index:60; display:flex; flex-direction:column; gap:12px; align-items:center; justify-content:flex-end;}
.pw-fab{width:56px; height:56px; border-radius:50%; background:var(--wire); color:#04241f; border:none; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px -8px rgba(0,217,184,.55); cursor:pointer; transition:.2s ease;}
.pw-tabbar{display:none; position:fixed; left:0; right:0; bottom:0; z-index:70; padding:8px 6px calc(6px + env(safe-area-inset-bottom)); background:color-mix(in srgb, var(--bg) 75%, transparent); backdrop-filter:blur(24px) saturate(180%); border-top:1px solid var(--border);}
.pw-tab-item{display:flex; flex-direction:column; align-items:center; gap:3px; color:var(--t3); background:none; border:none; padding:6px 10px; border-radius:14px; flex:1; min-width:0;}
.pw-tab-item.active{color:var(--wire);}
.pw-tab-item span{font-size:10px; font-weight:600;}

.pw-overlay{position:fixed; inset:0; z-index:200; background:var(--bg); overflow-y:auto; transform:translateY(100%); transition:transform .4s cubic-bezier(.32,.72,0,1); padding-bottom:calc(env(safe-area-inset-bottom) + 40px);}
.pw-overlay.open{transform:translateY(0);}
.pw-overlay-top{position:sticky; top:0; z-index:5; padding:env(safe-area-inset-top) 20px 0; background:color-mix(in srgb, var(--bg) 85%, transparent); backdrop-filter:blur(16px); border-bottom:1px solid var(--border);}
.pw-overlay-top-inner{display:flex; align-items:center; justify-content:space-between; padding:12px 0; gap:12px;}
.pw-close-btn{width:36px; height:36px; border-radius:50%; background:var(--surface-2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--t2); flex-shrink:0;}
.pw-article-body{max-width:700px; margin:0 auto; padding:36px 24px 0; width:100%;}
.pw-article-body h1{font-size:32px; line-height:1.15; margin:16px 0; letter-spacing:-.02em; overflow-wrap:anywhere;}
.pw-article-hero-img{width:100%; border-radius:var(--radius); aspect-ratio:16/9; object-fit:cover; margin:22px 0;}
.pw-lede{font-size:19px; line-height:1.65; color:var(--t1); font-family:'Fraunces',serif; overflow-wrap:anywhere;}
.pw-article-body p{font-size:17px; line-height:1.75; color:var(--t1); margin:0 0 20px; overflow-wrap:anywhere;}
.pw-ai-toolbar{display:flex; gap:8px; overflow-x:auto; padding:16px 0 20px; border-bottom:1px solid var(--border); margin-bottom:24px; -webkit-overflow-scrolling:touch;}
.pw-ai-pill{flex-shrink:0; display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:100px; font-size:12.5px; font-weight:600; border:1px solid var(--border); background:var(--surface); color:var(--t2); white-space:nowrap;}
.pw-ai-pill svg{color:var(--wire);}

/* ---------- Settings ---------- */
.pw-settings-wrap{max-width:640px; margin:0 auto; padding:8px 4px 40px; width:100%;}
.pw-settings-title{font-size:26px; margin:14px 0 22px;}
.pw-settings-group{border:1px solid var(--border); border-radius:var(--radius); background:var(--surface); margin-bottom:20px; overflow:hidden;}
.pw-settings-group h3{font-size:12px; text-transform:uppercase; letter-spacing:.07em; color:var(--t3); padding:14px 18px 6px; margin:0;}
.pw-settings-row{display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-top:1px solid var(--border); gap:14px; flex-wrap:wrap;}
.pw-settings-group h3 + .pw-settings-row{border-top:none;}
.pw-settings-row-label{display:flex; flex-direction:column; gap:2px; min-width:0;}
.pw-settings-row-label strong{font-size:14.5px; font-weight:600;}
.pw-settings-row-label span{font-size:12.5px; color:var(--t3);}
.pw-switch{width:48px; height:28px; border-radius:100px; border:1px solid var(--border); background:var(--surface-2); position:relative; flex-shrink:0; padding:0;}
.pw-switch-knob{width:22px; height:22px; border-radius:50%; background:#fff; position:absolute; top:2px; left:2px; transition:transform .25s cubic-bezier(.4,0,.2,1); box-shadow:0 1px 3px rgba(0,0,0,.3); display:block;}
.pw-switch.on{background:var(--wire); border-color:var(--wire);}
.pw-switch.on .pw-switch-knob{transform:translateX(20px);}
.pw-settings-danger{color:var(--alert);}
.pw-provider-chip{padding:9px 15px; border-radius:100px; border:1.5px solid var(--border); background:var(--surface); font-size:13.5px; font-weight:600; color:var(--t2); display:inline-flex; align-items:center; gap:6px;}
.pw-provider-chip.active{border-color:var(--wire); color:var(--wire); background:color-mix(in srgb, var(--wire) 10%, transparent);}
.pw-theme-grid{display:flex; gap:10px; flex-wrap:wrap;}
.pw-profile-photo-row{flex-direction:column; align-items:stretch;}
.pw-photo-actions{display:flex; gap:16px; flex-wrap:wrap; align-items:center; width:100%;}
.pw-avatar-preview{width:72px; height:72px; border-radius:24px; background:var(--surface-2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--t2); font-weight:700; font-size:20px; overflow:hidden;}
.pw-avatar-preview img{width:100%; height:100%; object-fit:cover;}
.pw-photo-buttons{display:flex; gap:10px; flex-wrap:wrap;}
.pw-textarea{resize:vertical; min-height:90px;}
.pw-settings-header{display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:18px; margin-bottom:16px;}
.pw-settings-subtitle{color:var(--t2); margin:6px 0 0; max-width:640px;}
.pw-settings-actions{display:flex; gap:12px; flex-wrap:wrap;}
.pw-saved-note{color:var(--wire); font-size:13px; font-weight:600;}
.pw-settings-nav-btn{display:flex; align-items:center; gap:6px; background:none; border:none; color:var(--t2); font-size:14px; font-weight:500; padding:9px 14px; border-radius:100px;}
.pw-settings-nav-btn:hover, .pw-settings-nav-btn.active{background:var(--surface-2); color:var(--t1);}

/* ---------- overflow / grid safety ---------- */
.pw-layout, .pw-layout > *{min-width:0;}
.pw-feed-grid > *{min-width:0;}
.pw-hero-post > *{min-width:0;}
.pw-topbar-inner > *{min-width:0;}
.pw-card-body h3, .pw-card-body p, .pw-hero-post h1, .pw-dek, .pw-article-body h1, .pw-article-body p{overflow-wrap:anywhere; word-break:break-word;}
.pw-preview-grid > *{min-width:0;}
.pw-hide-mobile{}

@media (max-width:980px){ .pw-layout{grid-template-columns:1fr;} .pw-sidebar{display:none;} }
@media (max-width:768px){
  .pw-topbar-search, .pw-nav-links{display:none;}
  .pw-topbar-inner{padding:12px 16px; gap:10px; min-height:60px;}
  .pw-root{--pw-header-h: calc(60px + env(safe-area-inset-top)); --pw-ticker-h: 38px;}
  .pw-hide-mobile{display:none !important;}
  .pw-wrap{padding:calc(var(--pw-header-h) + var(--pw-ticker-h) + 16px) 16px 110px; max-width:100%;}
  .pw-wrap.no-ticker{padding-top:calc(var(--pw-header-h) + 16px);}
  .pw-hero-post{grid-template-columns:1fr; gap:18px; margin-bottom:32px; padding-bottom:28px;}
  .pw-hero-post h1{font-size:24px; margin:12px 0;}
  .pw-dek{font-size:15px;}
  .pw-feed-grid{grid-template-columns:1fr; gap:16px;}
  .pw-tabbar{display:flex; justify-content:space-around;}
  .pw-row2{grid-template-columns:1fr;}
  .pw-card-body{padding:14px 14px 12px;}
  .pw-card-body h3{font-size:16.5px;}
  .pw-settings-row{padding:13px 14px;}
  .pw-settings-title{font-size:22px;}
  .pw-desktop-create-story{display:none !important;}
  .pw-stat-grid{grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px; margin-bottom:44px;}
  .pw-feature-grid{grid-template-columns:1fr 1fr; gap:14px;}
  .pw-category-grid{grid-template-columns:1fr 1fr; gap:10px;}
  .pw-why-grid{grid-template-columns:1fr; gap:14px;}
  .pw-studio-cards{grid-template-columns:1fr; gap:14px;}
  .pw-prediction-grid{grid-template-columns:1fr 1fr; gap:12px;}
  .pw-download-grid{grid-template-columns:1fr; gap:14px;}
  .pw-feature-news-grid{grid-template-columns:1fr; gap:14px;}
  .pw-newsletter{grid-template-columns:1fr; text-align:center; padding:24px;}
  .pw-newsletter-form{flex-direction:column;}
  .pw-newsletter-form input, .pw-newsletter-form button{width:100%;}
  .pw-footer-links{grid-template-columns:1fr 1fr; gap:20px;}
  .pw-section-head h2{font-size:24px;}
  .pw-section{margin-bottom:48px;}
}
@media (max-width:680px){
  .pw-landing-nav{flex-direction:column; align-items:flex-start; margin-bottom:36px;}
  .pw-mobile-menu-btn{display:flex;}
  .pw-landing-actions{justify-content:flex-start; width:100%; gap:10px;}
  .pw-landing-actions .pw-nav-link{display:none;}
  .pw-mobile-menu{display:none;}
  .pw-mobile-menu.open{display:flex;}
  .pw-hero-ctas, .pw-command-bar{flex-direction:column; align-items:stretch;}
  .pw-hero-ctas button, .pw-command-bar button{width:100%;}
  .pw-hero{padding:0 8px;}
  .pw-hero h1{font-size:32px;}
}
@media (max-width:480px){
  .pw-stat-grid, .pw-feature-grid, .pw-category-grid, .pw-prediction-grid, .pw-footer-links{grid-template-columns:1fr;}
}
@media (max-width:400px){
  .pw-hero-post h1{font-size:21px;}
  .pw-logo{font-size:17px;}
  .pw-icon-btn, .pw-avatar{width:34px; height:34px;}
}
@media (min-width:769px){ .pw-fab, .pw-tabbar{display:none;} }

.pw-reveal{opacity:0; transform:translateY(14px); animation:pwReveal .55s cubic-bezier(.2,.7,.2,1) forwards;}
@keyframes pwReveal{to{opacity:1; transform:translateY(0);}}
@media (prefers-reduced-motion: reduce){ .pw-root *{animation-duration:.001ms !important; transition-duration:.001ms !important;} }
`;

/* ------------------------------------------------------------------ */
/*  Small shared bits                                                   */
/* ------------------------------------------------------------------ */

function LogoMark({ size = 26, color = "var(--wire)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="12" stroke={color} strokeWidth="1.4" />
      <path d="M4 13h4l2-6 3 12 2.5-9 1.5 3h5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing page                                                       */
/* ------------------------------------------------------------------ */

function Landing({ onGetStarted, onSignIn, theme, toggleTheme }) {
  const [command, setCommand] = useState('What’s happening in AI today?');
  const [answer, setAnswer] = useState('PulseWire curates the latest AI headlines and delivers a concise news briefing tailored to your interests.');
  const [commandLoading, setCommandLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function runCommand() {
    setCommandLoading(true);
    setTimeout(() => {
      setAnswer('AI news intelligence is live: latest market moves, policy updates, and top stories curated for modern readers.');
      setCommandLoading(false);
    }, 800);
  }

  function handleSubscribe() {
    if (!newsletterEmail.includes('@')) {
      setNewsletterStatus('Enter a valid email to subscribe.');
      return;
    }
    setNewsletterStatus('Subscribed! You’ll get weekly PulseWire updates.');
    setNewsletterEmail('');
  }

  return (
    <div className="pw-landing">
      <div className="pw-landing-nav">
        <div className="pw-logo"><LogoMark />PulseWire</div>
        <button className="pw-mobile-menu-btn" onClick={() => setMobileMenuOpen((current) => !current)} aria-label="Toggle menu">
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className="pw-landing-actions">
          <button className="pw-nav-link" onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Features</button>
          <button className="pw-nav-link" onClick={() => { document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Pricing</button>
          <button className="pw-nav-link" onClick={() => { document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>FAQ</button>
          <button className="pw-theme-toggle" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} aria-label="Toggle theme">
            <div className="pw-knob">{theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}</div>
          </button>
          <button className="pw-ghost-btn" onClick={() => { onSignIn(); setMobileMenuOpen(false); }}>Log in</button>
        </div>
      </div>
      <div className={`pw-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="pw-nav-link" onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Features</button>
        <button className="pw-nav-link" onClick={() => { document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Pricing</button>
        <button className="pw-nav-link" onClick={() => { document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>FAQ</button>
        <button className="pw-ghost-btn" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}>Toggle theme</button>
        <button className="pw-btn-primary" onClick={() => { onSignIn(); setMobileMenuOpen(false); }}>Log in</button>
      </div>
      <section className="pw-hero-section pw-reveal">
        <div className="pw-hero-copy">
          <div className="pw-eyebrow"><Sparkles size={13} /> The future of AI-powered news starts here.</div>
          <h1 className="pw-serif">Discover trusted news, personalize your feed, generate AI summaries, and stay ahead with intelligent journalism.</h1>
          <p>PulseWire blends human reporting, AI-powered insights, and newsroom automation into one premium experience for readers, creators, and teams.</p>
          <div className="pw-hero-ctas">
            <button className="pw-btn-primary" onClick={onGetStarted}>Start reading</button>
            <button className="pw-btn-secondary" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>Get premium</button>
          </div>

          <div className="pw-command-bar">
            <Search size={18} />
            <input value={command} onChange={e => setCommand(e.target.value)} placeholder="Ask PulseWire what’s happening in AI..." />
            <button className="pw-btn-secondary" onClick={runCommand}>{commandLoading ? 'Thinking…' : 'Ask AI'}</button>
          </div>
          <div className="pw-command-answer">
            <strong>AI News Command Bar</strong>
            <p>{answer}</p>
          </div>
        </div>

        <div className="pw-hero-right">
          <div className="pw-hero-card pw-glow-card">
            <div className="pw-card-label">Breaking news</div>
            <h3>EU agrees new AI transparency rules</h3>
            <p>Leaders approve landmark policy to make AI-generated content traceable.</p>
          </div>
          <div className="pw-hero-card pw-card-small">
            <div className="pw-card-label">Trending</div>
            <h4>Bitcoin rally fuels global headlines</h4>
          </div>
          <div className="pw-hero-card pw-card-small">
            <div className="pw-card-label">Editor’s pick</div>
            <h4>Creator Studio boosts newsroom workflows</h4>
          </div>
          <div className="pw-hero-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="pw-ticker" style={{ position: 'static' }}>
              <div className="pw-ticker-inner" style={{ padding: '12px 16px' }}>
                <div className="pw-ticker-tag"><Bell size={12} /> Live</div>
                <div className="pw-ticker-track">
                  <div className="pw-ticker-scroll">
                    <span>Apple announces AI co-pilot for iOS.</span>
                    <span>Arsenal and Chelsea set for decisive title test.</span>
                    <span>NASA confirms new telescope data from Europa mission.</span>
                    <span>Crypto markets eye Fed commentary.</span>
                    <span>OpenAI publishes new journalism safety guidelines.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pw-stat-grid pw-reveal" style={{ animationDelay: '.08s' }}>
        {TRUSTED_STATS.map(stat => (
          <div key={stat.label} className="pw-stat-card">
            <div className="pw-stat-emoji">{stat.emoji}</div>
            <div>{stat.label}</div>
          </div>
        ))}
      </section>

      <section id="featured" className="pw-section pw-reveal" style={{ animationDelay: '.12s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">Featured news</span>
          <h2>Trusted coverage across breaking, trending, and editor-selected stories.</h2>
        </div>
        <div className="pw-feature-news-grid">
          {FEATURE_NEWS.map(item => (
            <article key={item.title} className="pw-feature-news-card">
              <span className="pw-card-badge">{item.badge}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="pw-section pw-reveal" style={{ animationDelay: '.16s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">AI features</span>
          <h2>Everything a modern news creator needs.</h2>
        </div>
        <div className="pw-feature-grid">
          {AI_FEATURES.map(feature => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="pw-feature-card">
                <div className="pw-ficon"><Icon size={18} /></div>
                <h4>{feature.title}</h4>
                <p>{feature.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pw-section pw-reveal" style={{ animationDelay: '.2s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">Categories</span>
          <h2>Fast paths to the topics that matter.</h2>
        </div>
        <div className="pw-category-grid">
          {CATEGORY_TAGS.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} className="pw-category-pill"><Icon size={16} /> {item.label}</button>
            );
          })}
        </div>
      </section>

      <section className="pw-section pw-reveal" style={{ animationDelay: '.24s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">Why choose PulseWire</span>
          <h2>AI-first news with speed, trust, and global coverage.</h2>
        </div>
        <div className="pw-why-grid">
          {WHY_CHOOSE_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="pw-why-card">
                <div className="pw-why-icon"><Icon size={18} /></div>
                <h4>{card.title}</h4>
                <p>{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pw-section pw-studio-grid pw-reveal" style={{ animationDelay: '.28s' }}>
        <div>
          <span className="pw-eyebrow">Creator AI Studio</span>
          <h2>Write, summarize, translate, and publish from one AI-driven dashboard.</h2>
          <p>See the workspace preview that powers newsroom creativity and editorial velocity.</p>
        </div>
        <div className="pw-studio-cards">
          <div className="pw-studio-card">
            <h4>Article Editor</h4>
            <p>Write headlines, structure briefs, and craft the full story in one place.</p>
          </div>
          <div className="pw-studio-card pw-studio-chat">
            <h4>Gemini AI Chat</h4>
            <p>Ask questions, refine drafts, and get smarter updates instantly.</p>
          </div>
          <div className="pw-studio-card">
            <h4>Generated Results</h4>
            <p>Review AI output with share-ready drafts and metadata suggestions.</p>
          </div>
        </div>
        <div className="pw-studio-actions">
          <button className="pw-pill">Rewrite</button>
          <button className="pw-pill">Summarize</button>
          <button className="pw-pill">SEO</button>
          <button className="pw-pill">Translate</button>
          <button className="pw-pill">Generate Social Posts</button>
        </div>
      </section>

      <section className="pw-section pw-preview-cards pw-reveal" style={{ animationDelay: '.32s' }}>
        <div className="pw-preview-card-large">
          <h3>Daily AI Briefing</h3>
          <p>Good morning 👋 Today’s top stories</p>
          <ul>
            <li>• Apple releases a new AI assistant update.</li>
            <li>• Bitcoin rises as markets digest earnings.</li>
            <li>• OpenAI launches a new newsroom safety tool.</li>
          </ul>
          <div className="pw-preview-meta">Reading time • 5 mins</div>
        </div>
        <div className="pw-preview-card-large pw-preview-podcast">
          <div className="pw-podcast-header">
            <div>
              <span className="pw-eyebrow">AI News Podcast</span>
              <h3>Latest episode: The future of generative briefing</h3>
            </div>
            <button className="pw-btn-secondary">Play</button>
          </div>
          <div className="pw-wave"><span /></div>
          <div className="pw-preview-meta">Duration • 18 min</div>
        </div>
      </section>

      <section className="pw-section pw-predictions pw-reveal" style={{ animationDelay: '.36s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">Community predictions</span>
          <h2>Who will win the next headline race?</h2>
        </div>
        <div className="pw-prediction-grid">
          <div className="pw-prediction-card">
            <h4>Arsenal</h4>
            <p>38%</p>
          </div>
          <div className="pw-prediction-card">
            <h4>Chelsea</h4>
            <p>27%</p>
          </div>
          <div className="pw-prediction-card">
            <h4>Barcelona</h4>
            <p>35%</p>
          </div>
          <div className="pw-leaderboard-card">
            <span>Top Predictor</span>
            <strong>Aisha M.</strong>
            <p>Accuracy 94%</p>
          </div>
        </div>
      </section>

      <section id="plans" className="pw-section pw-plans-grid pw-reveal" style={{ animationDelay: '.4s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">Premium plans</span>
          <h2>Plans built for every newsroom and reader.</h2>
        </div>
        <div className="pw-plan-cards">
          {PLANS.map(plan => (
            <div key={plan.tier} className={`pw-plan-card ${plan.highlight ? 'highlight' : ''}`}>
              <span className="pw-plan-label">{plan.tier}</span>
              <strong>{plan.price}</strong>
              <p>{plan.note}</p>
              <ul>
                {plan.perks.map(perk => <li key={perk}>{perk}</li>)}
              </ul>
              <button className={`pw-btn-secondary ${plan.highlight ? 'pw-btn-primary' : ''}`} onClick={onGetStarted}>{plan.highlight ? 'Choose Pro' : 'Start free'}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="pw-section pw-testimonials pw-reveal" style={{ animationDelay: '.44s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">What customers say</span>
          <h2>Trusted by newsroom leaders and creators.</h2>
        </div>
        <div className="pw-testimonial-grid">
          {TESTIMONIALS.map(testimonial => (
            <div key={testimonial.name} className="pw-testimonial-card">
              <div className="pw-testimonial-profile">
                <div className="pw-avatar">{testimonial.name.charAt(0)}</div>
                <div>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
              <p>“{testimonial.quote}”</p>
              <div className="pw-stars">{Array.from({ length: testimonial.rating }, (_, index) => <span key={index}>⭐</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="pw-section pw-faq pw-reveal" style={{ animationDelay: '.48s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">FAQ</span>
          <h2>Answers to the questions people ask most.</h2>
        </div>
        <div className="pw-faq-list">
          {FAQ_ITEMS.map((item, index) => (
            <div key={item.question} className={`pw-faq-item ${activeFaq === index ? 'open' : ''}`} onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
              <button type="button" className="pw-faq-question">
                <span>{item.question}</span>
                <span>{activeFaq === index ? '−' : '+'}</span>
              </button>
              {activeFaq === index && <p>{item.answer}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="pw-section pw-download pw-reveal" style={{ animationDelay: '.52s' }}>
        <div className="pw-section-head">
          <span className="pw-eyebrow">Download app</span>
          <h2>Coming soon to Android and iPhone.</h2>
        </div>
        <div className="pw-download-grid">
          {DOWNLOAD_ITEMS.map(item => (
            <div key={item.platform} className="pw-download-card">
              <h4>{item.platform}</h4>
              <p>{item.label}</p>
            </div>
          ))}
          <div className="pw-download-qr">
            <div className="pw-qr-placeholder">QR</div>
            <p>Scan to join the PulseWire preview.</p>
          </div>
        </div>
      </section>

      <section className="pw-section pw-newsletter pw-reveal" style={{ animationDelay: '.56s' }}>
        <div className="pw-newsletter-copy">
          <span className="pw-eyebrow">Newsletter</span>
          <h2>Stay updated with weekly newsroom highlights.</h2>
        </div>
        <div className="pw-newsletter-form">
          <input type="email" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder="Your email address" />
          <button className="pw-btn-primary" onClick={handleSubscribe}>Subscribe</button>
        </div>
        {newsletterStatus && <p className="pw-newsletter-status">{newsletterStatus}</p>}
      </section>

      <footer className="pw-footer pw-reveal" style={{ animationDelay: '.6s' }}>
        <div className="pw-footer-links">
          <div>
            <strong>PulseWire</strong>
            <nav>
              <a href="#featured">About</a>
              <a href="#plans">Blog</a>
              <a href="#plans">Pricing</a>
              <a href="#faq">API</a>
            </nav>
          </div>
          <div>
            <strong>Support</strong>
            <nav>
              <a href="#faq">Support</a>
              <a href="#faq">Privacy</a>
              <a href="#faq">Terms</a>
            </nav>
          </div>
          <div>
            <strong>Social</strong>
            <nav>
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
              <a href="#">Instagram</a>
            </nav>
          </div>
        </div>
        <div className="pw-footer-copy">© {new Date().getFullYear()} PulseWire. All rights reserved.</div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Signup flow                                                        */
/* ------------------------------------------------------------------ */

function StepAccount({ form, setForm, onNext, onBack }) {
  const valid = form.firstName.trim() && form.lastName.trim() && form.email.trim().includes("@") && form.password.length >= 6;
  return (
    <div className="pw-signup-card">
      <button className="pw-signup-back" onClick={onBack}><ArrowLeft size={15} /> Back</button>
      <div className="pw-progress"><i className="done" /><i /><i /></div>
      <h2 className="pw-serif">Create your account</h2>
      <p>Let's start with the basics.</p>

      <div className="pw-row2">
        <div className="pw-field">
          <label>First name</label>
          <input className="pw-input" placeholder="Cyril" value={form.firstName}
                 onChange={e => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div className="pw-field">
          <label>Last name</label>
          <input className="pw-input" placeholder="Israel" value={form.lastName}
                 onChange={e => setForm({ ...form, lastName: e.target.value })} />
        </div>
      </div>
      <div className="pw-field">
        <label>Email address</label>
        <input className="pw-input" type="email" placeholder="you@example.com" value={form.email}
               onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="pw-field">
        <label>Password</label>
        <input className="pw-input" type="password" placeholder="At least 6 characters" value={form.password}
               onChange={e => setForm({ ...form, password: e.target.value })} />
        <div className="pw-hint">You can also continue with Google or GitHub from here.</div>
      </div>

      <div className="pw-row2" style={{ marginBottom: 20 }}>
        <button className="pw-btn-secondary" type="button">Continue with Google</button>
        <button className="pw-btn-secondary" type="button">Continue with GitHub</button>
      </div>

      <button className="pw-btn-primary pw-continue" disabled={!valid} onClick={onNext}>
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

function StepDOB({ form, setForm, onNext, onBack }) {
  const valid = !!form.dob;
  let age: number | null = null;
  if (valid) {
    const d = new Date(form.dob);
    if (!isNaN(d.getTime())) {
      const diff = Date.now() - d.getTime();
      age = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
    }
  }
  const tooYoung = age !== null && age < 13;
  return (
    <div className="pw-signup-card">
      <button className="pw-signup-back" onClick={onBack}><ArrowLeft size={15} /> Back</button>
      <div className="pw-progress"><i className="done" /><i className="done" /><i /></div>
      <h2 className="pw-serif">When's your birthday?</h2>
      <p>This helps us keep PulseWire age-appropriate and won't be shown on your profile.</p>

      <div className="pw-field">
        <label>Date of birth</label>
        <input className="pw-input" type="date" value={form.dob}
               onChange={e => setForm({ ...form, dob: e.target.value })} />
        {tooYoung && <div className="pw-hint" style={{ color: "var(--alert)" }}>You need to be at least 13 to join PulseWire.</div>}
      </div>

      <button className="pw-btn-primary pw-continue" disabled={!valid || tooYoung} onClick={onNext}>
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

function StepInterests({ form, setForm, onFinish, onBack }) {
  const toggle = (cat) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(cat) ? f.interests.filter(c => c !== cat) : [...f.interests, cat]
    }));
  };
  const valid = form.interests.length >= 3;
  return (
    <div className="pw-signup-card">
      <button className="pw-signup-back" onClick={onBack}><ArrowLeft size={15} /> Back</button>
      <div className="pw-progress"><i className="done" /><i className="done" /><i className="done" /></div>
      <h2 className="pw-serif">Build your feed</h2>
      <p>Pick at least 3 topics — PulseWire will lead your feed with these and keep tuning it as you read.</p>

      <div className="pw-interest-grid">
        {CATEGORIES.map(cat => {
          const picked = form.interests.includes(cat);
          return (
            <button key={cat} className={`pw-interest-chip ${picked ? "picked" : ""}`} onClick={() => toggle(cat)}>
              {picked && <Check size={14} />} {cat}
            </button>
          );
        })}
      </div>
      <div className="pw-count-note">{form.interests.length} selected {form.interests.length < 3 ? `· pick ${3 - form.interests.length} more` : ""}</div>

      <button className="pw-btn-primary pw-continue" disabled={!valid} onClick={onFinish} style={{ marginTop: 14 }}>
        Start reading <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings page                                                       */
/* ------------------------------------------------------------------ */

function Switch({ on, onClick, label }) {
  return (
    <button className={`pw-switch ${on ? "on" : ""}`} onClick={onClick} aria-label={label} aria-pressed={on} type="button">
      <span className="pw-switch-knob" />
    </button>
  );
}

function SettingsPage({ theme, toggleTheme, form, setForm, notif, setNotif, aiProvider, setAiProvider, onLogout }) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [privacy, setPrivacy] = useState({ publicProfile: true, searchIndex: false, messageRequests: true });
  const [saved, setSaved] = useState(false);

  const toggleInterest = (cat) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(cat) ? f.interests.filter(c => c !== cat) : [...f.interests, cat]
    }));
  };

  const displayName = form.displayName?.trim() || `${form.firstName} ${form.lastName}`.trim() || "PulseWire user";
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }

    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const saveSettings = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="pw-settings-wrap">
      <div className="pw-settings-header">
        <div>
          <h1 className="pw-settings-title pw-serif">Settings</h1>
          <p className="pw-settings-subtitle">Update your profile, notifications, AI preferences, and app appearance in one place.</p>
        </div>
        <button className="pw-btn-primary" onClick={saveSettings}>{saved ? "✓ Saved" : "Save changes"}</button>
      </div>

      <div className="pw-settings-group">
        <h3>Appearance</h3>
        <div className="pw-settings-row">
          <div className="pw-settings-row-label"><strong>Dark mode</strong><span>Switch between light and dark themes</span></div>
          <Switch on={theme === "dark"} onClick={toggleTheme} label="Toggle dark mode" />
        </div>
      </div>

      <div className="pw-settings-group">
        <h3>Profile</h3>
        <div className="pw-settings-row pw-profile-photo-row">
          <div className="pw-settings-row-label"><strong>Profile photo</strong><span>Choose an avatar for your PulseWire profile</span></div>
          <div className="pw-photo-actions">
            <div className="pw-avatar-preview">
              {photoPreview ? <img src={photoPreview} alt="Profile preview" /> : <span>{initials}</span>}
            </div>
            <div className="pw-photo-buttons">
              <label className="pw-ghost-btn">
                {photoFile ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/*" hidden onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
              </label>
              {photoFile ? <button className="pw-ghost-btn" type="button" onClick={() => setPhotoFile(null)}>Remove</button> : null}
            </div>
          </div>
        </div>

        <div className="pw-settings-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
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

        <div className="pw-settings-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="pw-field" style={{ marginBottom: 0 }}>
            <label>Display name</label>
            <input className="pw-input" value={form.displayName} placeholder="Best name for your profile" onChange={e => setForm({ ...form, displayName: e.target.value })} />
          </div>
        </div>

        <div className="pw-settings-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="pw-field" style={{ marginBottom: 0 }}>
            <label>Bio</label>
            <textarea className="pw-input pw-textarea" rows={3} placeholder="Tell readers a little about yourself" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>
        </div>

        <div className="pw-settings-row">
          <div className="pw-settings-row-label"><strong>Email</strong><span>{form.email || "Not set"}</span></div>
          <button className="pw-ghost-btn" type="button">Change</button>
        </div>
        <div className="pw-settings-row">
          <div className="pw-settings-row-label"><strong>Password</strong><span>••••••••</span></div>
          <button className="pw-ghost-btn" type="button">Change</button>
        </div>
        <div className="pw-settings-row">
          <div className="pw-settings-row-label"><strong>Date of birth</strong><span>{form.dob || "Not set"}</span></div>
          <button className="pw-ghost-btn" type="button">Change</button>
        </div>
        <div className="pw-settings-row">
          <div className="pw-settings-row-label"><strong>Language</strong><span>Application language and formatting</span></div>
          <select className="pw-input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} style={{ minWidth: 140 }}>
            {["English", "Español", "Français", "Deutsch"].map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>
      </div>

      <div className="pw-settings-group">
        <h3>Your feed</h3>
        <div className="pw-settings-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="pw-interest-grid" style={{ marginBottom: 0 }}>
            {CATEGORIES.map(cat => {
              const picked = form.interests.includes(cat);
              return (
                <button key={cat} className={`pw-interest-chip ${picked ? "picked" : ""}`} onClick={() => toggleInterest(cat)}>
                  {picked && <Check size={14} />} {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pw-settings-group">
        <h3>AI assistant</h3>
        <div className="pw-settings-row">
          <div className="pw-settings-row-label"><strong>Preferred AI model</strong><span>Used for summaries, chat, translation and writing tools</span></div>
        </div>
        <div className="pw-settings-row" style={{ gap: 10 }}>
          {["ChatGPT", "Claude", "Grok"].map(p => (
            <button key={p} className={`pw-provider-chip ${aiProvider === p ? "active" : ""}`} onClick={() => setAiProvider(p)}>
              {aiProvider === p && <Check size={13} />} {p}
            </button>
          ))}
        </div>
      </div>

      <div className="pw-settings-group">
        <h3>Notifications</h3>
        {[
          { key: "breaking", label: "Breaking news alerts", desc: "Get notified the moment big stories break" },
          { key: "comments", label: "Comments & replies", desc: "When someone responds to you" },
          { key: "follows", label: "New followers", desc: "When someone follows your profile" },
          { key: "email", label: "Email digest", desc: "A daily summary sent to your inbox" },
          { key: "push", label: "Push notifications", desc: "Alerts on this device" },
        ].map(item => (
          <div className="pw-settings-row" key={item.key}>
            <div className="pw-settings-row-label"><strong>{item.label}</strong><span>{item.desc}</span></div>
            <Switch on={!!notif[item.key]} onClick={() => setNotif(n => ({ ...n, [item.key]: !n[item.key] }))} label={item.label} />
          </div>
        ))}
      </div>

      <div className="pw-settings-group">
        <h3>Privacy</h3>
        {[
          { key: "publicProfile", label: "Public profile", desc: "Allow others to find and follow your profile" },
          { key: "searchIndex", label: "Search indexing", desc: "Show your profile in search results" },
          { key: "messageRequests", label: "Message requests", desc: "Allow people to send you messages" },
        ].map(item => (
          <div className="pw-settings-row" key={item.key}>
            <div className="pw-settings-row-label"><strong>{item.label}</strong><span>{item.desc}</span></div>
            <Switch on={privacy[item.key]} onClick={() => setPrivacy(p => ({ ...p, [item.key]: !p[item.key] }))} label={item.label} />
          </div>
        ))}
      </div>

      <div className="pw-settings-group">
        <h3>Account</h3>
        <div className="pw-settings-row">
          <div className="pw-settings-row-label"><strong className="pw-settings-danger">Log out</strong><span>You'll return to the landing page</span></div>
          <button className="pw-ghost-btn" onClick={onLogout}><LogOut size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Log out</button>
        </div>
      </div>
    </div>
  );
}

function LoginCard({ onSubmit, onBack, form, setForm, loading = false, error = "" }) {
  return (
    <div className="pw-signup-card">
      <button className="pw-signup-back" onClick={onBack}><ArrowLeft size={15} /> Back</button>
      <div className="pw-progress"><i className="done" /><i className="done" /><i className="done" /></div>
      <h2 className="pw-serif">Sign in to PulseWire</h2>
      <p>Use your Supabase account to access your feed, follow creators, and publish news.</p>

      <div className="pw-field">
        <label>Email address</label>
        <input className="pw-input" type="email" placeholder="you@example.com" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="pw-field">
        <label>Password</label>
        <input className="pw-input" type="password" placeholder="••••••••" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} />
      </div>

      {error ? <div className="pw-auth-alert">{error}</div> : null}

      <button className="pw-btn-primary pw-continue" onClick={onSubmit} disabled={loading}>
        {loading ? "Signing in..." : "Continue to feed"} <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Signup({ step, form, setForm, onNext, onBack, onFinish, onExit }) {
  return (
    <div className="pw-signup-wrap">
      {step === "account" && <StepAccount form={form} setForm={setForm} onNext={onNext} onBack={onExit} />}
      {step === "dob" && <StepDOB form={form} setForm={setForm} onNext={onNext} onBack={onBack} />}
      {step === "interests" && <StepInterests form={form} setForm={setForm} onFinish={onFinish} onBack={onBack} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main app (feed) — reused after signup or "log in"                  */
/* ------------------------------------------------------------------ */

function AppShell({ theme, toggleTheme, form, setForm, onLogout }) {
  const [tab, setTab] = useState("feed"); // feed | settings
  const [activePill, setActivePill] = useState("For You");
  const [liked, setLiked] = useState(new Set());
  const [saved, setSaved] = useState(new Set());
  const [openId, setOpenId] = useState(null);
  const [notif, setNotif] = useState({ breaking: true, comments: true, follows: false, email: true, push: true });
  const [aiProvider, setAiProvider] = useState("ChatGPT");
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", excerpt: "", category: "Technology", image: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [publishToast, setPublishToast] = useState("");
  const [aiActionLoading, setAiActionLoading] = useState(false);
  const [articleAiResult, setArticleAiResult] = useState("");
  const [feedArticles, setFeedArticles] = useState<Article[]>(ARTICLES);
  const [feedError, setFeedError] = useState("");

  const firstName = form.firstName;
  const interests = form.interests;

  const ordered = useMemo(() => {
    if (!interests || interests.length === 0) return feedArticles;
    const rest = feedArticles.filter(a => !a.hero);
    const matched = rest.filter(a => interests.includes(a.cat));
    const unmatched = rest.filter(a => !interests.includes(a.cat));
    return [feedArticles.find(a => a.hero) as Article, ...matched, ...unmatched].filter(Boolean) as Article[];
  }, [interests, feedArticles]);

  const hero = ordered.find(a => a.hero) || feedArticles[0];
  const rest = ordered.filter(a => a.id !== hero.id);
  const filtered = activePill === "For You" ? rest : rest.filter(a => a.cat === activePill);
  const openArticle = feedArticles.find(a => a.id === openId) ?? null;

  const toggleSet = (setFn, id) => setFn(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const initials = (firstName || "You").slice(0, 2).toUpperCase();

  useEffect(() => {
    async function loadPosts() {
      try {
        const [postResponse, newsResponse] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/news/stored'),
        ]);

        const postPayload = await postResponse.json();
        const newsPayload = await newsResponse.json();

        const apiPosts = Array.isArray(postPayload.posts) ? postPayload.posts.map((post: any, index: number) => ({
          id: post.id || `api-${index}`,
          cat: post.category || 'Technology',
          img: Array.isArray(post.imageUrls) ? (post.imageUrls[0] || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&q=80') : 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&q=80',
          title: post.title || 'PulseWire story',
          excerpt: post.excerpt || post.content || '',
          author: post.authorName || post.authorEmail?.split('@')[0] || 'PulseWire user',
          authorId: post.authorEmail || 'local-user',
          authorVerified: !!post.authorVerifiedBadge,
          time: 'Just now',
          read: '2 min',
          hero: false,
        })) : [];

        const newsPosts = Array.isArray(newsPayload.articles) ? newsPayload.articles.map((article: any, index: number) => ({
          id: article.id ? `news-${article.id}` : `news-${index}`,
          cat: article.category || 'World News',
          img: article.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=80',
          title: article.title || 'News article',
          excerpt: article.summary || article.description || (article.content ? String(article.content).slice(0, 120) : ''),
          author: article.source || article.author || 'PulseWire News',
          authorId: article.source || 'pulsewire-news',
          time: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Now',
          read: '5 min',
          hero: false,
        })) : [];

        const combined = [...newsPosts, ...apiPosts];
        setFeedArticles((prev) => {
          const hero = prev.find(a => a.hero);
          return hero ? [hero, ...combined] : combined;
        });
        setFeedError('');
      } catch (error) {
        console.warn('Could not load feed posts from API.', error);
        setFeedError('Unable to refresh the feed. Showing the latest available stories.');
      }
    }

    loadPosts();
  }, []);

  const runArticleAi = async (mode: "summarize" | "translate", article: Article) => {
    const text = `${article.title}\n\n${article.excerpt}`;
    if (!text.trim()) return;

    setAiActionLoading(true);
    setArticleAiResult("");

    try {
      const endpoint = mode === "summarize" ? "/api/ai/summarize" : "/api/ai/translate";
      const body = mode === "summarize"
        ? { text }
        : { text, targetLanguage: "Spanish" };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      const result = payload.summary || payload.translation || "I could not generate that AI result right now.";
      setArticleAiResult(result);
    } catch (error) {
      console.error("Article AI action failed", error);
      setArticleAiResult("The AI action failed. Please try again on the dedicated PulseWireAI page.");
    } finally {
      setAiActionLoading(false);
    }
  };

  const publishStory = async () => {
    if (!draft.title.trim() || !draft.excerpt.trim()) return;

    const entry = {
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      category: draft.category,
      authorEmail: form.email || 'anonymous@pulsewire.local',
      imageUrl: draft.image || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&q=80',
      readTime: '2 min',
    };

    try {
      if (imageFile) {
        try {
          const uploadResult = await uploadFileToBucket(imageFile, 'post-images');
          entry.imageUrl = uploadResult.publicUrl;
        } catch (uploadError) {
          console.warn('Image upload failed, falling back to URL field.', uploadError);
        }
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Unable to publish right now');
      }

      const payload = await response.json();
      const created = payload.post;
      setFeedArticles(prev => [
        {
          id: created.id,
          cat: created.category || entry.category,
          img: Array.isArray(created.imageUrls) ? (created.imageUrls[0] || entry.imageUrl) : entry.imageUrl,
          title: created.title,
          excerpt: created.excerpt,
          author: created.authorName || entry.authorEmail.split('@')[0],
          authorId: created.authorEmail || entry.authorEmail,
          time: 'Just now',
          read: entry.readTime,
          hero: false,
        },
        ...prev,
      ].slice(0, 12));

      setPublishToast('Story published to your feed.');
    } catch (error) {
      console.error('Publishing failed', error);
      setPublishToast('Unable to publish story right now.');
    } finally {
      setDraft({ title: '', excerpt: '', category: 'Technology', image: '' });
      setImageFile(null);
      setComposerOpen(false);
      setTimeout(() => setPublishToast(''), 2200);
    }
  };

  return (
    <>
      <header className="pw-topbar">
        <div className="pw-topbar-inner">
          <div className="pw-logo"><LogoMark />PulseWire</div>
          <nav className="pw-nav-links">
            <button className={tab === "feed" ? "active" : ""} onClick={() => setTab("feed")}>For You</button>
            <button onClick={() => setTab("feed")}>Technology</button>
            <button onClick={() => setTab("feed")}>Business</button>
            <button onClick={() => setTab("feed")}>World</button>
            <button onClick={() => setTab("feed")}>Crypto</button>
          </nav>
          <div className="pw-topbar-search"><button className="pw-icon-btn" aria-label="Search"><Search size={17} /></button></div>
          <div className="pw-topbar-right">
            <button className="pw-btn-secondary pw-hide-mobile" onClick={() => window.location.assign('/ai')} style={{ padding: '10px 16px' }}>PulseWireAI</button>
            <button className="pw-btn-secondary pw-hide-mobile" onClick={() => window.location.assign('/community/discussions')} style={{ padding: '10px 16px' }}>Chat</button>
            <button className="pw-btn-primary pw-desktop-create-story" onClick={() => setComposerOpen(true)} style={{ padding: '10px 16px' }}>Create story</button>
            <button className="pw-icon-btn" onClick={() => window.location.assign('/alerts')} aria-label="Open alerts"><Bell size={17} /><span className="pw-dot-badge" /></button>
            <button className="pw-icon-btn pw-hide-mobile" aria-label="Discover" onClick={() => window.location.assign('/discover')}><Compass size={17} /></button>
            <button className="pw-icon-btn pw-hide-mobile" aria-label="Profile" onClick={() => window.location.assign('/profile')}><User size={17} /></button>
            <button className="pw-icon-btn pw-hide-mobile" aria-label="Settings" onClick={() => setTab("settings")}>
              <SettingsIcon size={17} />
            </button>
            <button className="pw-avatar" style={{ border: "none", padding: 0 }} onClick={() => window.location.assign('/profile')} aria-label="Open profile">{initials}</button>
          </div>
        </div>
      </header>

      {tab === "feed" && (
        <div className="pw-ticker">
          <div className="pw-ticker-inner">
            <div className="pw-ticker-tag"><span className="pw-pulse-dot" />Breaking</div>
            <div className="pw-ticker-track">
              <div className="pw-ticker-scroll">
                <span>Central bank holds rates steady, signals cuts by Q4</span>
                <span>OpenAI, Anthropic and xAI models now benchmark within 2% of each other</span>
                <span>Gold hits fresh high as dollar weakens on inflation data</span>
                <span>Global chip shortage eases as new fabs come online</span>
                <span>Central bank holds rates steady, signals cuts by Q4</span>
                <span>OpenAI, Anthropic and xAI models now benchmark within 2% of each other</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`pw-wrap ${tab === "feed" ? "" : "no-ticker"}`}>
        {tab === "settings" ? (
          <SettingsPage
            theme={theme} toggleTheme={toggleTheme}
            form={form} setForm={setForm}
            notif={notif} setNotif={setNotif}
            aiProvider={aiProvider} setAiProvider={setAiProvider}
            onLogout={onLogout}
          />
        ) : (
          <div className="pw-layout">
            <main>
              <section className="pw-hero-post pw-reveal">
                <div className="pw-hero-media" onClick={() => setOpenId(hero.id)}>
                  <img src={hero.img} alt="" />
                  <span className="pw-cat-chip">{hero.cat}</span>
                </div>
                <div className="pw-hero-post-content">
                  <div><span className="pw-ai-chip"><Sparkles size={12} /> AI Brief available</span></div>
                  <h1 className="pw-serif" onClick={() => setOpenId(hero.id)}>{hero.title}</h1>
                  <p className="pw-dek">{hero.excerpt}</p>
                  <div className="pw-byline">
                    <span className="pw-name">{hero.author}</span><i>·</i><span>{hero.read}</span><i>·</i><span>{hero.time}</span>
                  </div>
                </div>
              </section>

              <div className="pw-pills">
                {["For You", ...CATEGORIES].map(cat => (
                  <button key={cat} className={`pw-pill ${activePill === cat ? "active" : ""}`} onClick={() => setActivePill(cat)}>{cat}</button>
                ))}
              </div>

              <div className="pw-section-head"><h2>{firstName ? `Latest for ${firstName}` : "Latest for you"}</h2></div>
              <div className="pw-feed-grid">
                {filtered.map((a, i) => (
                  <div key={a.id} className="pw-card pw-reveal" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => setOpenId(a.id)}>
                    <div className="pw-card-media"><img src={a.img} alt="" /><span className="pw-cat-chip">{a.cat}</span></div>
                    <div className="pw-card-body">
                      <h3>{a.title}</h3>
                      <p>{a.excerpt}</p>
                      <div className="pw-card-meta">
                        <div className="pw-meta-left"><div className="pw-mini-avatar" />
                          <span>
                            {a.author} {a.authorVerified ? <span style={{ color: 'var(--gold)', marginLeft: 6, fontWeight: 700 }}>★</span> : null} · {a.time} · {a.read}
                          </span>
                        </div>
                        <div className="pw-actions">
                          <button className={`pw-action-btn ${liked.has(a.id) ? "liked" : ""}`} onClick={e => { e.stopPropagation(); toggleSet(setLiked, a.id); }}>
                            <Heart size={16} fill={liked.has(a.id) ? "currentColor" : "none"} />
                          </button>
                          <button className={`pw-action-btn ${saved.has(a.id) ? "saved" : ""}`} onClick={e => { e.stopPropagation(); toggleSet(setSaved, a.id); }}>
                            <Bookmark size={16} fill={saved.has(a.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </main>

            <aside className="pw-sidebar">
              <PulseWireAi inline defaultPrompt="Summarize the top story and tell me what the most important takeaways are." />
              <div className="pw-side-card">
                <div className="pw-section-head" style={{ marginBottom: 4 }}><h2>Trending now</h2></div>
                {ARTICLES.slice(0, 4).map((a, i) => (
                  <div className="pw-trend-item" key={a.id}>
                    <span className="pw-trend-rank pw-serif">{i + 1}</span>
                    <div className="pw-trend-info"><h4>{a.title}</h4><span>{a.cat} · {(20 - i * 4)}.{i}k reading</span></div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>

      {tab === "feed" && (
        <div className="pw-fab-container">
          <button className="pw-fab" aria-label="PulseWire AI" onClick={() => window.location.assign('/ai')} style={{ background: '#7C3AED' }} title="Ask PulseWire AI">
            <Sparkles size={22} color="#FFF" />
          </button>
          <button className="pw-fab" aria-label="Write article" onClick={() => setComposerOpen(true)}><Plus size={22} color="#04241f" /></button>
        </div>
      )}

      <nav className="pw-tabbar">
        <button className={`pw-tab-item ${tab === "feed" ? "active" : ""}`} onClick={() => setTab("feed")}><Home size={21} /><span>Home</span></button>
        <button className="pw-tab-item" onClick={() => window.location.assign('/discover')}><Compass size={21} /><span>Discover</span></button>
        <button className="pw-tab-item" onClick={() => window.location.assign('/alerts')}><Bell size={21} /><span>Alerts</span></button>
        <button className="pw-tab-item" onClick={() => window.location.assign('/community/discussions')}><MessageSquare size={21} /><span>Chat</span></button>
        <button className="pw-tab-item" onClick={() => window.location.assign('/profile')}><User size={21} /><span>Profile</span></button>
      </nav>

      <div className={`pw-overlay ${composerOpen ? "open" : ""}`}>
        {composerOpen && (
          <>
            <div className="pw-overlay-top">
              <div className="pw-overlay-top-inner">
                <button className="pw-close-btn" onClick={() => setComposerOpen(false)}><X size={16} /></button>
                <div className="pw-actions">
                  <button className="pw-action-btn" onClick={() => setComposerOpen(false)}><Share2 size={18} /></button>
                </div>
              </div>
            </div>
            <div className="pw-article-body" style={{ maxWidth: 560 }}>
              <span className="pw-cat-chip outline">Create a story</span>
              <h1 className="pw-serif" style={{ fontSize: 28 }}>Publish a quick PulseWire update</h1>
              <div className="pw-field">
                <label>Headline</label>
                <input className="pw-input" placeholder="What happened?" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
              </div>
              <div className="pw-field">
                <label>Category</label>
                <select className="pw-input" value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="pw-field">
                <label>Story details</label>
                <textarea className="pw-input" rows={5} placeholder="Add a short, factual summary of the story you want to share." value={draft.excerpt} onChange={e => setDraft(d => ({ ...d, excerpt: e.target.value }))} />
              </div>
              <div className="pw-field">
                <label>Image URL (optional)</label>
                <input className="pw-input" placeholder="https://..." value={draft.image} onChange={e => setDraft(d => ({ ...d, image: e.target.value }))} />
              </div>
              <div className="pw-field">
                <label>Upload image (optional)</label>
                <input
                  className="pw-input"
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                  }}
                />
              </div>
              {imageFile ? (
                <div className="pw-image-preview">
                  <span>Selected image:</span>
                  <img src={URL.createObjectURL(imageFile)} alt="Upload preview" />
                </div>
              ) : null}
              <button className="pw-btn-primary pw-continue" onClick={publishStory}>Publish story <ArrowRight size={16} /></button>
              {publishToast ? <div className="pw-auth-alert" style={{ marginTop: 12 }}>{publishToast}</div> : null}
            </div>
          </>
        )}
      </div>

      <div className={`pw-overlay ${openArticle ? "open" : ""}`}>
        {openArticle && (
          <>
            <div className="pw-overlay-top">
              <div className="pw-overlay-top-inner">
                <button className="pw-close-btn" onClick={() => setOpenId(null)}><X size={16} /></button>
                <div className="pw-actions">
                  <button className="pw-action-btn"><Heart size={18} /></button>
                  <button className="pw-action-btn"><Bookmark size={18} /></button>
                  <button className="pw-action-btn"><Share2 size={18} /></button>
                </div>
              </div>
            </div>
            <div className="pw-article-body">
              <span className="pw-cat-chip outline">{openArticle.cat}</span>
              <h1 className="pw-serif">{openArticle.title}</h1>
              <div className="pw-byline" style={{ marginBottom: 18 }}>
                <div className="pw-mini-avatar" style={{ width: 28, height: 28 }} />
                <span className="pw-name">{openArticle.author}</span><i>·</i><span>{openArticle.read}</span><i>·</i><span>{openArticle.time}</span>
              </div>
              <div className="pw-ai-toolbar">
                <button className="pw-ai-pill" onClick={() => runArticleAi("summarize", openArticle)}><Sparkles size={13} /> {aiActionLoading ? "Working..." : "Summarize"}</button>
                <button className="pw-ai-pill" onClick={() => runArticleAi("translate", openArticle)}><Languages size={13} /> Translate</button>
                <button className="pw-ai-pill" onClick={() => window.location.assign('/ai')}><MessageSquare size={13} /> Ask AI</button>
                <button className="pw-ai-pill"><ShieldCheck size={13} /> Fact-check</button>
              </div>
              <img className="pw-article-hero-img" src={openArticle.img} alt="" />
              <p className="pw-lede">{openArticle.excerpt}</p>
              {articleAiResult ? (
                <div className="pw-side-card" style={{ margin: '16px 0 0', padding: 16 }}>
                  <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--wire)', fontWeight: 700, marginBottom: 8 }}>AI result</div>
                  <div style={{ color: 'var(--t1)', lineHeight: 1.6, fontSize: 14 }}>{articleAiResult}</div>
                </div>
              ) : null}
              <p>Reporters gathered additional detail overnight, and analysts continue to weigh the broader implications for the sector as the story develops through the day.</p>
              <p>PulseWire will update this story as more information becomes available, with an AI-generated summary refreshed automatically whenever the article changes.</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Root component                                                     */
/* ------------------------------------------------------------------ */

export default function PulseWire() {
  const [theme, setTheme] = useState("dark");
  const [view, setView] = useState("landing"); // landing | account | dob | interests | login | app
  const [form, setForm] = useState({
    firstName: "", lastName: "", displayName: "", bio: "", email: "", password: "", dob: "", interests: [], language: "English"
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  const goApp = () => setView("app");
  const resetForm = () => setForm({ firstName: "", lastName: "", displayName: "", bio: "", email: "", password: "", dob: "", interests: [], language: "English" });

  const handleCreateAccount = async () => {
    if (!supabase) {
      setAuthError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to continue.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          username: form.displayName?.trim() || `${form.firstName} ${form.lastName}`.trim() || form.email,
          display_name: form.displayName,
          bio: form.bio,
          dob: form.dob,
          interests: form.interests,
          language: form.language,
        },
      },
    });

    if (error) {
      setAuthLoading(false);
      setAuthError(error.message);
      return;
    }

    if (data?.session) {
      setAuthLoading(false);
      setView("app");
      return;
    }

    setAuthLoading(false);
    setAuthError("Almost done — check your inbox to confirm your account before signing in.");
    setView("login");
  };

  const handleSignIn = async () => {
    if (!supabase) {
      setAuthError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to continue.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setAuthLoading(false);
      setAuthError(error.message);
      return;
    }

    setAuthLoading(false);
    if (data.user) {
      setView("app");
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setView("landing");
    resetForm();
    setAuthError("");
  };

  return (
    <div className="pw-root" data-theme={theme}>
      <style
        dangerouslySetInnerHTML={{
          __html: CSS,
        }}
      />

      {view === "landing" && (
        <Landing onGetStarted={() => setView("account")} onSignIn={() => setView("login")} theme={theme} toggleTheme={toggleTheme} />
      )}

      {(view === "account" || view === "dob" || view === "interests") && (
        <Signup
          step={view}
          form={form}
          setForm={setForm}
          onNext={() => setView(view === "account" ? "dob" : "interests")}
          onBack={() => setView(view === "interests" ? "dob" : "account")}
          onFinish={handleCreateAccount}
          onExit={() => setView("landing")}
        />
      )}

      {view === "login" && (
        <div className="pw-signup-wrap">
          <LoginCard
            onSubmit={handleSignIn}
            onBack={() => setView("landing")}
            form={form}
            setForm={setForm}
            loading={authLoading}
            error={authError}
          />
        </div>
      )}

      {view === "app" && (
        <AppShell
          theme={theme}
          toggleTheme={toggleTheme}
          form={form}
          setForm={setForm}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}