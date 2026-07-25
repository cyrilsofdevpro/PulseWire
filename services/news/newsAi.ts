import { generateWithFallback } from '../../lib/llm'
import type { NewsArticle } from './newsData'

export type NewsArticleMetadata = {
  summary: string
  tldr: string
  seoTitle: string
  metaDescription: string
  keywords: string[]
  tags: string[]
  suggestedCategory: string
  socialCaption: string
}

function extractJsonObject(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1)
  }
  return ''
}

function parseMetadata(text: string): Partial<NewsArticleMetadata> {
  const body = extractJsonObject(text)
  if (!body) return {}

  try {
    const result = JSON.parse(body)
    return {
      summary: String(result.summary || '').trim(),
      tldr: String(result.tldr || result.tl_dr || result['tl;dr'] || '').trim(),
      seoTitle: String(result.seoTitle || result.seo_title || result.title || '').trim(),
      metaDescription: String(result.metaDescription || result.meta_description || result.description || '').trim(),
      keywords: Array.isArray(result.keywords) ? result.keywords.map(String).filter(Boolean) : String(result.keywords || '').split(/[\s,;]+/).filter(Boolean),
      tags: Array.isArray(result.tags) ? result.tags.map(String).filter(Boolean) : String(result.tags || '').split(/[\s,;]+/).filter(Boolean),
      suggestedCategory: String(result.suggestedCategory || result.suggested_category || '').trim(),
      socialCaption: String(result.socialCaption || result.social_caption || '').trim(),
    }
  } catch (error) {
    return {}
  }
}

async function safeGenerate(prompt: string, opts: any = {}) {
  const result = await generateWithFallback(prompt, { task: 'analysis', max_tokens: 520, ...opts })
  return String(result?.text || '').trim()
}

export async function generateNewsArticleMetadata(article: NewsArticle, opts: any = {}) {
  const textBlock = [article.title, article.description, article.content]
    .filter(Boolean)
    .join('\n\n')
    .trim()

  const prompt = `You are a news content assistant.
Read the article and return a valid JSON object with these fields:
summary, tldr, seoTitle, metaDescription, keywords, tags, suggestedCategory, socialCaption.
Use short, publication-ready values.

Article title: ${article.title}
Category: ${article.category}
Source: ${article.source || 'unknown'}
Published at: ${article.publishedAt || 'unknown'}

Article content:
${textBlock}

Return only the JSON object and nothing else.`

  const responseText = await safeGenerate(prompt, opts)
  const parsed = parseMetadata(responseText)
  const fallbackKeywords = Array.from(new Set((article.title + ' ' + article.description).toLowerCase().match(/\b[a-z]{4,}\b/g) || [])).slice(0, 8)

  return {
    summary: parsed.summary || article.description || article.content.slice(0, 200),
    tldr: parsed.tldr || article.description || article.content.slice(0, 140),
    seoTitle: parsed.seoTitle || article.title,
    metaDescription: parsed.metaDescription || article.description || article.content.slice(0, 180),
    keywords: parsed.keywords.length ? parsed.keywords : fallbackKeywords,
    tags: parsed.tags.length ? parsed.tags : fallbackKeywords,
    suggestedCategory: parsed.suggestedCategory || article.category,
    socialCaption: parsed.socialCaption || `Read the latest on ${article.title} and stay up to speed with breaking insights.`,
  }
}
