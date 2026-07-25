import type { NextApiRequest, NextApiResponse } from 'next'
import { categorizePost, suggestTags, moderateContent, summarizeText, generateAiReply } from '../../../lib/ai'
import { fetchArticles } from '../../../lib/groq'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { question } = req.body
  if (!question) return res.status(400).json({ error: 'question is required' })

  try {
    const summary = await summarizeText(String(question))
    const category = await categorizePost(String(question))
    const tags = await suggestTags(String(question))
    const moderation = await moderateContent(String(question))

    let matches: any[] = []
    try {
      const articles = await fetchArticles()
      const q = String(question).toLowerCase()
      const scored = (articles || []).map((a: any) => {
        const hay = ((a.title || '') + ' ' + (a.body || '')).toLowerCase()
        let score = 0
        if (q.split(' ').some((w: string) => hay.includes(w))) score += 1
        for (const t of tags) if (hay.includes(String(t).toLowerCase())) score += 1
        return { article: a, score }
      })
      matches = scored.filter((s: any) => s.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 5).map((s: any) => ({
        id: s.article._id,
        title: s.article.title,
        summary: s.article.body ? String(s.article.body).slice(0, 200) : null,
      }))
    } catch (e) {
      matches = []
    }

    let answer = ''
    if (matches.length) {
      answer = `I found ${matches.length} related article(s). Top: ${matches.map((m) => m.title).join('; ')}`
    } else {
      const isGreeting = /^(hi|hello|hey|good\s?(morning|afternoon|evening))$/i.test(String(question).trim())
      if (isGreeting) {
        answer = `Hi! How can I help you today? You can ask about articles, request summaries, or ask general questions.`
      } else {
        answer = `I couldn't find direct articles. Summary: ${summary}`
      }
      if (!process.env.GEMINI_API_KEY && (!process.env.GROK_API_KEY || !process.env.GROK_API_URL)) {
        answer += ' (Note: AI providers are not configured yet, so the fallback response is being used.)'
      }
    }

    try {
      const context = matches.map((m: any) => `- ${m.title}: ${m.summary || ''}`)
      const aiAnswer = await generateAiReply(String(question), context, { max_tokens: 512 })
      if (aiAnswer) answer = aiAnswer
    } catch (e) {
      console.error('Unexpected error during AI reply generation:', e)
    }

    return res.status(200).json({ answer, summary, category, tags, moderation, matches })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'AI chat error', details: String(err) })
  }
}
