import React, { useState } from 'react'

type PulseWireAiProps = {
  inline?: boolean
  defaultPrompt?: string
}

export default function PulseWireAi({ inline = false, defaultPrompt = '' }: PulseWireAiProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState(defaultPrompt)
  const [loading, setLoading] = useState(false)

  async function send(mode: 'chat' | 'summarize' | 'analyze' | 'headline' | 'rewrite' | 'grammar' | 'seo' | 'facts' | 'sentiment' = 'chat') {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMsg = { role: 'user', text: trimmed }
    setMessages((m) => [...m, userMsg])
    setLoading(true)

    try {
      let res: Response
      let payload: any = null
      let text = ''

      if (mode === 'summarize') {
        res = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        })
        payload = await res.json()
        text = payload.summary || 'I could not create a summary from that input.'
      } else if (mode === 'analyze') {
        res = await fetch('/api/ai/analyze-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        })
        payload = await res.json()
        text = payload.llmAnalysis?.text || payload.summary || 'I could not analyze that content.'
      } else if (mode === 'headline') {
        res = await fetch('/api/ai/headline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        })
        payload = await res.json()
        text = payload.headline || 'I could not generate a headline right now.'
      } else if (mode === 'rewrite') {
        res = await fetch('/api/ai/rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        })
        payload = await res.json()
        text = payload.rewritten || 'I could not rewrite that article right now.'
      } else if (mode === 'grammar') {
        res = await fetch('/api/ai/grammar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        })
        payload = await res.json()
        text = payload.corrected || 'I could not proofread that text right now.'
      } else if (mode === 'seo') {
        res = await fetch('/api/ai/seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        })
        payload = await res.json()
        text = payload.seo || 'I could not generate SEO recommendations right now.'
      } else if (mode === 'facts') {
        res = await fetch('/api/ai/facts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        })
        payload = await res.json()
        text = payload.explanation || 'I could not explain that topic right now.'
      } else if (mode === 'sentiment') {
        res = await fetch('/api/ai/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        })
        payload = await res.json()
        text = payload.sentiment || 'I could not analyze the sentiment right now.'
      } else {
        res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: trimmed }),
        })
        payload = await res.json()
        text = payload.answer || 'I could not answer that question right now.'
      }

      const botMsg = { role: 'assistant', text, meta: payload }
      setMessages((m) => [...m, botMsg])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, something went wrong.' }])
    } finally {
      setInput('')
      setLoading(false)
    }
  }

  const renderPanel = () => (
    <div className={inline ? 'pw-side-card' : 'pw-ai-widget'} style={inline ? { marginBottom: 0 } : { marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 700 }}>PulseWireAI</div>
          <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 4 }}>Ask questions, summarize stories, analyze drafts, and spot themes instantly.</div>
        </div>
        {!inline && (
          <button onClick={() => setOpen(false)} className="pw-btn-secondary">Close</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={() => send('chat')} disabled={loading} className="pw-btn-secondary">Ask AI</button>
        <button onClick={() => send('summarize')} disabled={loading} className="pw-btn-secondary">Summarize</button>
        <button onClick={() => send('headline')} disabled={loading} className="pw-btn-secondary">Headline</button>
        <button onClick={() => send('rewrite')} disabled={loading} className="pw-btn-secondary">Rewrite</button>
        <button onClick={() => send('grammar')} disabled={loading} className="pw-btn-secondary">Grammar</button>
        <button onClick={() => send('seo')} disabled={loading} className="pw-btn-secondary">SEO</button>
        <button onClick={() => send('facts')} disabled={loading} className="pw-btn-secondary">Explain</button>
        <button onClick={() => send('sentiment')} disabled={loading} className="pw-btn-secondary">Sentiment</button>
        <button onClick={() => send('analyze')} disabled={loading} className="pw-btn-secondary">Analyze</button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--t2)', fontSize: 13 }}>Try: “Summarize this post”, “Analyze my draft”, or “What are the top themes?”</div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            border: '1px solid var(--border)',
            borderRadius: 14,
            background: m.role === 'user' ? 'var(--surface-2)' : 'var(--surface)',
            padding: 12,
            color: 'var(--t1)',
            fontSize: 13.5,
            lineHeight: 1.55,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: m.role === 'user' ? 'var(--wire)' : 'var(--t1)' }}>{m.role === 'user' ? 'You' : 'PulseWireAI'}</div>
            <div>{m.text}</div>
            {m.meta && m.meta.matches && m.meta.matches.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong>Related articles:</strong>
                <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                  {m.meta.matches.map((mm: any) => (
                    <li key={mm.id}>{mm.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 14 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="pw-input"
          placeholder="Ask PulseWireAI about a post, trend, or story..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') send('chat')
          }}
        />
        <button onClick={() => send('chat')} disabled={loading} className="pw-btn-primary">
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  )

  if (inline) {
    return (
      <section className="pw-side-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 700 }}>PulseWireAI</div>
            <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 4 }}>Summaries, analysis, and live answers on demand.</div>
          </div>
          <button onClick={() => setOpen((s) => !s)} className="pw-btn-primary">{open ? 'Close' : 'Open'}</button>
        </div>

        {open && <div style={{ marginTop: 2 }}>{renderPanel()}</div>}
      </section>
    )
  }

  return (
    <div className="pw-ai-widget">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 700 }}>PulseWireAI</div>
          <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 4 }}>Your built-in newsroom assistant.</div>
        </div>
        <button onClick={() => setOpen((s) => !s)} className="pw-btn-primary">{open ? 'Hide' : 'Open'}</button>
      </div>

      {open && renderPanel()}
    </div>
  )
}
