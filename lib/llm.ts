type LlmResponse = { text?: string; raw?: any }

type LlmTask =
  | 'chat'
  | 'summarize'
  | 'translate'
  | 'analysis'
  | 'headline'
  | 'rewrite'
  | 'grammar'
  | 'seo'
  | 'social'
  | 'brainstorm'
  | 'briefing'
  | 'predictions'
  | 'podcast'
  | 'facts'
  | 'sentiment'

function normalizeProviderText(value: unknown) {
  if (value === undefined || value === null) return ''
  const text = String(value).trim()
  if (!text) return ''

  const lines = text.split(/\r?\n/)
  const kept = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('{"type":"reasoning"'))

  return kept.length ? kept.join('\n') : text
}

function normalizeUrl(url?: string) {
  if (!url) return null
  let u = String(url)
  if (u.endsWith('/')) u = u.slice(0, -1)
  if (u.endsWith('/openai/v1') || u.endsWith('/v1')) return `${u}/responses`
  return u
}

function getGeminiModel(task: LlmTask, opts: any = {}) {
  if (opts.geminiModel) return opts.geminiModel
  if (task === 'chat') return process.env.GEMINI_MODEL_CHAT || 'gemini-2.0-flash'
  if (task === 'summarize') return process.env.GEMINI_MODEL_SUMMARY || 'gemini-2.0-flash'
  if (task === 'headline') return process.env.GEMINI_MODEL_HEADLINE || 'gemini-2.0-flash'
  return process.env.GEMINI_MODEL_CHAT || 'gemini-2.0-flash'
}

function getGrokModel(task: LlmTask, opts: any = {}) {
  if (opts.grokModel) return opts.grokModel
  if (task === 'chat') return process.env.GROK_MODEL_CHAT || 'llama-3.3-70b'
  if (task === 'summarize') return process.env.GROK_MODEL_SUMMARY || 'llama-3.3-70b'
  if (task === 'headline') return process.env.GROK_MODEL_HEADLINE || 'llama-3.3-70b'
  return process.env.GROK_MODEL_CHAT || 'llama-3.3-70b'
}

function getProviderOrder(opts: any = {}) {
  const preferred = opts.provider === 'grok' ? 'grok' : 'gemini'
  return preferred === 'grok' ? ['grok', 'gemini'] : ['gemini', 'grok']
}

export async function callGemini(model: string, prompt: string, opts: any = {}): Promise<LlmResponse> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not configured')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`
  const generationConfig: Record<string, any> = {}
  if (opts?.max_tokens) generationConfig.maxOutputTokens = opts.max_tokens
  if (opts?.temperature !== undefined) generationConfig.temperature = opts.temperature
  if (opts?.top_p !== undefined) generationConfig.topP = opts.top_p

  const body: Record<string, any> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  }
  if (Object.keys(generationConfig).length) body.generationConfig = generationConfig

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) {
    const detail = json?.error?.message || JSON.stringify(json)
    throw new Error(`Gemini request failed: ${res.status} ${res.statusText} ${detail}`)
  }

  const text = normalizeProviderText(
    json?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .filter(Boolean)
      .join('\n')
      .trim()
  )

  if (text) return { text, raw: json }
  console.error('Gemini raw response (unparsed):', JSON.stringify(json).slice(0, 3000))
  return { raw: json }
}

export async function callGrok(model: string, prompt: string, opts: any = {}): Promise<LlmResponse> {
  const url = normalizeUrl(process.env.GROK_API_URL)
  const key = process.env.GROK_API_KEY
  if (!url || !key) throw new Error('GROK_API_URL or GROK_API_KEY not configured')

  const bodyOpts: any = {}
  if (opts?.max_tokens) bodyOpts.max_output_tokens = opts.max_tokens
  if (opts?.temperature !== undefined) bodyOpts.temperature = opts.temperature
  if (opts?.top_p !== undefined) bodyOpts.top_p = opts.top_p
  const body = { model, input: prompt, ...bodyOpts }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) {
    const detail = json?.error?.message || JSON.stringify(json)
    throw new Error(`Grok request failed: ${res.status} ${res.statusText} ${detail}`)
  }

  if (Array.isArray(json?.output)) {
    const parts = json.output
      .map((o: any) => {
        if (typeof o === 'string') return o
        if (o?.type === 'reasoning') return ''
        if (o?.type === 'output_text' && o?.text) return normalizeProviderText(o.text)
        if (o?.text) return normalizeProviderText(o.text)
        if (Array.isArray(o?.content)) {
          return o.content
            .map((c: any) => {
              if (c?.type === 'reasoning') return ''
              if (c?.text) return normalizeProviderText(c.text)
              return JSON.stringify(c)
            })
            .filter(Boolean)
            .join('\n')
        }
        return JSON.stringify(o)
      })
      .filter(Boolean)

    const text = normalizeProviderText(parts.join('\n'))
    if (text) return { text, raw: json }
  }
  if (json?.output) return { text: normalizeProviderText(String(json.output)), raw: json }
  if (json?.choices?.[0]?.text) return { text: normalizeProviderText(String(json.choices[0].text)), raw: json }
  if (json?.results?.[0]?.content) {
    const c = json.results[0].content
    const txt = Array.isArray(c)
      ? c
          .map((x: any) => {
            if (x?.type === 'reasoning') return ''
            if (x?.text) return normalizeProviderText(x.text)
            return x?.type || JSON.stringify(x)
          })
          .filter(Boolean)
          .join('\n')
      : String(c)
    const text = normalizeProviderText(txt)
    if (text) return { text, raw: json }
  }

  console.error('Grok raw response (unparsed):', JSON.stringify(json).slice(0, 3000))
  return { raw: json }
}

export async function generateWithFallback(prompt: string, opts: any = {}): Promise<LlmResponse | null> {
  const task: LlmTask = String(opts.task || 'chat') as LlmTask
  const geminiModel = getGeminiModel(task, opts)
  const grokModel = getGrokModel(task, opts)
  const providers = getProviderOrder(opts)

  for (const provider of providers) {
    if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      try {
        const response = await callGemini(geminiModel, prompt, opts)
        if (response?.text) return response
      } catch (error) {
        console.error('Gemini request failed, trying fallback:', error)
      }
    }

    if (provider === 'grok' && process.env.GROK_API_KEY && process.env.GROK_API_URL) {
      try {
        const response = await callGrok(grokModel, prompt, opts)
        if (response?.text) return response
      } catch (error) {
        console.error('Grok request failed, trying fallback:', error)
      }
    }
  }

  return null
}

export default { callGemini, callGrok, generateWithFallback }
