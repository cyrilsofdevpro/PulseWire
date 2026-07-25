import {
  analyzeSentiment,
  analyzeWithAi,
  categorizePost,
  explainFact,
  generateAiReply,
  generateCommunityPredictions,
  generateDailyBriefing,
  generateHeadline,
  generatePodcastScript,
  generateSocialTeasers,
  grammarCheck,
  optimizeSeo,
  rewriteArticle,
  summarizeText,
  summarizeWithAi,
  suggestTags,
  moderateContent,
  translateText,
  brainstormStoryIdeas,
} from './ai'
import { fetchArticles } from './groq'

export type AiTool =
  | 'chat'
  | 'summarize'
  | 'translate'
  | 'draft'
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

function getPayloadText(payload: any) {
  return String(payload?.text || payload?.question || payload?.prompt || payload?.topic || '').trim()
}

export async function runAiTool(tool: AiTool, payload: any = {}) {
  const text = getPayloadText(payload)
  const opts = payload.opts || {}

  switch (tool) {
    case 'chat': {
      const question = String(payload.question || payload.text || '').trim()
      if (!question) {
        throw new Error('question is required for chat')
      }

      const summary = await summarizeText(question)
      const category = await categorizePost(question)
      const tags = await suggestTags(question)
      const moderation = await moderateContent(question)

      let matches: any[] = []
      try {
        const articles = await fetchArticles()
        const q = question.toLowerCase()
        const scored = (articles || []).map((a: any) => {
          const hay = (((a.title || '') as string) + ' ' + ((a.body || '') as string)).toLowerCase()
          let score = 0
          if (q.split(' ').some((w: string) => hay.includes(w))) score += 1
          for (const t of tags) if (hay.includes(String(t).toLowerCase())) score += 1
          return { article: a, score }
        })
        matches = scored
          .filter((s: any) => s.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5)
          .map((s: any) => ({
            id: s.article._id,
            title: s.article.title,
            summary: s.article.body ? String(s.article.body).slice(0, 200) : null,
          }))
      } catch (error) {
        matches = []
      }

      const context = matches.map((m: any) => `- ${m.title}: ${m.summary || ''}`)
      const answer = await generateAiReply(question, context, { task: 'chat', max_tokens: 512, ...opts })
      return { result: answer, summary, category, tags, moderation, matches }
    }

    case 'summarize': {
      if (!text) throw new Error('text is required for summarize')
      const summary = await summarizeWithAi(text, { task: 'summarize', max_tokens: 256, ...opts })
      return { result: summary, summary }
    }

    case 'translate': {
      if (!text) throw new Error('text is required for translate')
      const targetLanguage = String(payload.targetLanguage || 'Spanish')
      const translation = await translateText(text, targetLanguage, { task: 'translate', max_tokens: 512, ...opts })
      return { result: translation, translation }
    }

    case 'analysis': {
      if (!text) throw new Error('text is required for analysis')
      const analysis = await analyzeWithAi(text, { task: 'analysis', max_tokens: 512, ...opts })
      return { result: analysis, analysis }
    }

    case 'headline': {
      if (!text) throw new Error('text is required for headline')
      const headline = await generateHeadline(text, { task: 'headline', max_tokens: 256, ...opts })
      return { result: headline, headline }
    }

    case 'draft': {
      if (!text) throw new Error('text is required for draft')
      const rewritten = await rewriteArticle(text, { task: 'draft', max_tokens: 512, ...opts })
      return { result: rewritten, rewritten }
    }

    case 'rewrite': {
      if (!text) throw new Error('text is required for rewrite')
      const rewritten = await rewriteArticle(text, { task: 'rewrite', max_tokens: 512, ...opts })
      return { result: rewritten, rewritten }
    }

    case 'grammar': {
      if (!text) throw new Error('text is required for grammar')
      const corrected = await grammarCheck(text, { task: 'grammar', max_tokens: 512, ...opts })
      return { result: corrected, corrected }
    }

    case 'seo': {
      if (!text) throw new Error('text is required for seo')
      const seo = await optimizeSeo(text, { task: 'seo', max_tokens: 400, ...opts })
      return { result: seo, seo }
    }

    case 'social': {
      if (!text) throw new Error('text is required for social')
      const social = await generateSocialTeasers(text, { task: 'social', max_tokens: 320, ...opts })
      return { result: social, social }
    }

    case 'brainstorm': {
      if (!text) throw new Error('text is required for brainstorm')
      const brainstorm = await brainstormStoryIdeas(text, { task: 'brainstorm', max_tokens: 320, ...opts })
      return { result: brainstorm, brainstorm }
    }

    case 'briefing': {
      const topic = text || String(payload.topic || 'the latest global news')
      const briefing = await generateDailyBriefing(topic, { task: 'briefing', max_tokens: 420, ...opts })
      return { result: briefing, briefing }
    }

    case 'predictions': {
      const topic = text || String(payload.topic || 'emerging tech trends')
      const predictions = await generateCommunityPredictions(topic, { task: 'predictions', max_tokens: 320, ...opts })
      return { result: predictions, predictions }
    }

    case 'podcast': {
      const topic = text || String(payload.topic || "today's top headlines")
      const podcast = await generatePodcastScript(topic, { task: 'podcast', max_tokens: 420, ...opts })
      return { result: podcast, podcast }
    }

    case 'facts': {
      if (!text) throw new Error('text is required for facts')
      const explanation = await explainFact(text, { task: 'facts', max_tokens: 512, ...opts })
      return { result: explanation, explanation }
    }

    case 'sentiment': {
      if (!text) throw new Error('text is required for sentiment')
      const sentiment = await analyzeSentiment(text, { task: 'sentiment', max_tokens: 256, ...opts })
      return { result: sentiment, sentiment }
    }

    default:
      throw new Error(`Unsupported AI tool: ${tool}`)
  }
}
