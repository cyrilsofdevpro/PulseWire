import { generateWithFallback } from './llm'

function splitSentences(text: string) {
  return text
    .replace(/\r\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function fallbackResponse(prefix: string, input: string) {
  return `${prefix}: ${input.slice(0, 120)}`
}

export async function summarizeText(text: string) {
  if (!text) return ''
  const sentences = splitSentences(text)
  if (sentences.length === 0) return text.slice(0, 300)
  if (sentences.length <= 2) return sentences.join(' ')
  return `${sentences[0]} ${sentences[1]}`
}

export async function summarizeWithAi(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const fallback = summarizeText(input)
  try {
    const prompt = `Summarize the following text in 1-2 concise sentences.\n\n${input}`
    const llm = await generateWithFallback(prompt, { task: 'summarize', max_tokens: 256, ...opts })
    if (llm?.text) return llm.text.trim()
    return fallback
  } catch (error) {
    console.error('summarizeWithAi failed, using fallback:', error)
    return fallback
  }
}

export async function translateText(text: string, targetLanguage = 'Spanish', opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  try {
    const prompt = `Translate the following text into ${targetLanguage}. Preserve the meaning and the tone as closely as possible.\n\n${input}`
    const llm = await generateWithFallback(prompt, { task: 'translate', max_tokens: 512, ...opts })
    if (llm?.text) return llm.text.trim()
    return input
  } catch (error) {
    console.error('translateText failed, using fallback:', error)
    return input
  }
}

export async function analyzeWithAi(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Analyze the following content and provide a concise, human-readable assessment with a short summary and any notable concerns.\n\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'analysis', max_tokens: 512, ...opts })
  if (llm?.text) return llm.text.trim()
  return summarizeText(input)
}

export async function generateAiReply(question: string, context: string[] = [], opts: any = {}) {
  const input = String(question || '').trim()
  if (!input) return ''

  const q = input.toLowerCase()
  const identityQueries = [
    'who created you',
    'who made you',
    'who built you',
    'who designed you',
    'who developed you',
  ]
  if (identityQueries.some((s) => q.includes(s))) {
    return 'I am the official AI assistant for PulseWire. PulseWire was created by the PulseWire Team, and the platform was developed by Cyril Sofdev, the lead software developer behind the project.'
  }

  const cyrilQueries = [
    'who is cyril sofdev',
    'tell me about cyril sofdev',
    'who developed pulsewire',
    'who is the developer',
  ]
  if (cyrilQueries.some((s) => q.includes(s))) {
    return 'Cyril Sofdev is a software developer and AI engineer specializing in modern web applications, artificial intelligence, automation, and scalable software systems. He is the lead developer of PulseWire and focuses on building intelligent digital products that combine AI with excellent user experiences. Cyril Sofdev works on AI-powered applications, software engineering, automation systems, modern web development, and innovative technology solutions.'
  }

  const contextBlock = context.length ? `\n\nContext articles:\n${context.join('\n')}` : ''
  const prompt = `You are PulseWireAI. Answer the user's question concisely and helpfully.${contextBlock}\n\nQuestion: ${input}`
  const llm = await generateWithFallback(prompt, { task: 'chat', max_tokens: 512, ...opts })
  if (llm?.text) return llm.text.trim()
  return ''
}

export async function generateHeadline(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Generate 5 catchy, SEO-friendly headline variations for the following story. Keep them short, sharp, and newsroom-appropriate.\n\nStory:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'headline', max_tokens: 256, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('Headline ideas for', input)
}

export async function rewriteArticle(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Rewrite the following article to improve readability and clarity while preserving the original meaning and tone.\n\nArticle:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'rewrite', max_tokens: 512, ...opts })
  if (llm?.text) return llm.text.trim()
  return input
}

export async function grammarCheck(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Proofread and improve grammar, punctuation, and sentence flow without changing the author's meaning.\n\nText:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'grammar', max_tokens: 512, ...opts })
  if (llm?.text) return llm.text.trim()
  return input
}

export async function explainFact(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Explain the topic in simple language with short background context and key takeaways.\n\nTopic:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'facts', max_tokens: 512, ...opts })
  if (llm?.text) return llm.text.trim()
  return input
}

export async function analyzeSentiment(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Analyze the sentiment of the following text and return a concise sentiment label plus a 2-3 sentence explanation.\n\nText:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'sentiment', max_tokens: 256, ...opts })
  if (llm?.text) return llm.text.trim()
  return `Sentiment analysis unavailable for: ${input.slice(0, 120)}`
}

export async function optimizeSeo(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Generate an SEO title, meta description, and keyword recommendations for the following story. Keep it concise and publish-ready.\n\nStory:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'seo', max_tokens: 400, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('SEO recommendations for', input)
}

export async function recommendContent(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Recommend 3 related articles or topics based on the user's interest and the following article. Format as short recommendations with one-line reasons.\n\nInterest:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'analysis', max_tokens: 320, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('Recommended reads for', input)
}

export async function detectDuplicate(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Determine whether the following article looks duplicate, copied, or substantially similar to existing coverage. Return a short risk assessment and recommendation.\n\nArticle:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'analysis', max_tokens: 256, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('Duplicate detection review for', input)
}

export async function brainstormStoryIdeas(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `You are an editorial AI assistant for PulseWire. Generate 6 creative article or story ideas based on this topic. Include fresh angles, audience hooks, and newsroom-ready framing.\n\nTopic:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'brainstorm', max_tokens: 320, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('Brainstorm ideas for', input)
}

export async function generateSocialTeasers(text: string, opts: any = {}) {
  const input = String(text || '').trim()
  if (!input) return ''

  const prompt = `Write 4 social media headline-style teasers and hashtag suggestions for the following story. Keep them punchy, native to platforms like X and LinkedIn, and include a clear hook.\n\nStory:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'social', max_tokens: 320, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('Social teasers for', input)
}

export async function generateDailyBriefing(topic: string, opts: any = {}) {
  const input = String(topic || 'the latest global news').trim()
  const prompt = `Create a daily newsroom briefing with 3 top stories, one-line summaries, and practical takeaways for an audience of active readers. Focus on clarity, speed, and relevance.\n\nTopic:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'briefing', max_tokens: 420, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('Daily briefing for', input)
}

export async function generateCommunityPredictions(topic: string, opts: any = {}) {
  const input = String(topic || 'emerging tech trends').trim()
  const prompt = `Draft 5 sharp community predictions for the following theme. Each prediction should be realistic, numbered, and include a short rationale.\n\nTheme:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'predictions', max_tokens: 320, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('Community predictions for', input)
}

export async function generatePodcastScript(topic: string, opts: any = {}) {
  const input = String(topic || "today's top headlines").trim()
  const prompt = `Write a short AI news podcast script for PulseWire. Include an intro hook, 3 segment summaries, and a closing call-to-action. Keep the voice conversational and authoritative.\n\nTopic:\n${input}`
  const llm = await generateWithFallback(prompt, { task: 'podcast', max_tokens: 420, ...opts })
  if (llm?.text) return llm.text.trim()
  return fallbackResponse('Podcast script for', input)
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics: ['election', 'government', 'congress', 'senate', 'president', 'policy'],
  technology: ['technology', 'startup', 'software', 'ai', 'machine learning', 'javascript', 'react'],
  sports: ['game', 'score', 'match', 'league', 'tournament', 'goal', 'player'],
  business: ['market', 'stocks', 'business', 'company', 'startup', 'finance', 'investment'],
  entertainment: ['movie', 'music', 'tv', 'celebrity', 'concert', 'film'],
  health: ['health', 'medical', 'doctor', 'covid', 'disease', 'wellness'],
  science: ['research', 'study', 'scientists', 'science'],
  travel: ['travel', 'flight', 'hotel', 'destination', 'tourism'],
}

export async function categorizePost(text: string) {
  if (!text) return 'uncategorized'
  const t = text.toLowerCase()
  const scores: Record<string, number> = {}
  for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = 0
    for (const k of keys) if (t.includes(k)) scores[cat] += 1
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  if (!best || best[1] === 0) return 'uncategorized'
  return best[0]
}

const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'of', 'in', 'to', 'for', 'with', 'that', 'this', 'it', 'as', 'are', 'was', 'by', 'from', 'be', 'or', 'have', 'has', 'had', 'but', 'not', 'you', 'i', 'we', 'they', 'he', 'she', 'them', 'his', 'her', 'our', 'us'
])

export async function suggestTags(text: string) {
  if (!text) return []
  const words = text
    .toLowerCase()
    .replace(/["'“”‘’\.\,\!\?\(\)\[\]\{\};:]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
  const freq: Record<string, number> = {}
  for (const w of words) {
    if (w.length < 3) continue
    if (STOPWORDS.has(w)) continue
    freq[w] = (freq[w] || 0) + 1
  }
  const tags = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map((p) => p[0])
  return tags
}

const PROFANITY = ['fuck', 'shit', 'bitch', 'bastard', 'asshole', 'damn']

export async function moderateContent(text: string) {
  const t = String(text || '')
  const urlMatch = t.match(/https?:\/\//g) || []
  const urlCount = urlMatch.length
  const hashtagCount = (t.match(/#/g) || []).length
  const repeatedLong = /(\w)\1{9,}/.test(t)
  const containsProfanity = PROFANITY.some((p) => t.toLowerCase().includes(p))

  const spam = urlCount > 1 || hashtagCount > 10 || repeatedLong
  const offensive = containsProfanity

  const details = { urlCount, hashtagCount, repeatedLong, containsProfanity }
  return { spam, offensive, details }
}

export default {
  summarizeText,
  summarizeWithAi,
  translateText,
  analyzeWithAi,
  generateAiReply,
  generateHeadline,
  rewriteArticle,
  grammarCheck,
  explainFact,
  analyzeSentiment,
  optimizeSeo,
  recommendContent,
  detectDuplicate,
  brainstormStoryIdeas,
  generateSocialTeasers,
  generateDailyBriefing,
  generateCommunityPredictions,
  generatePodcastScript,
  categorizePost,
  suggestTags,
  moderateContent,
}
