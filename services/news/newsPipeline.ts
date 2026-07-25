import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { fetchLatestNews, fetchNewsByCategory, fetchNewsByKeyword, NewsArticle } from './newsData'
import { generateNewsArticleMetadata } from './newsAi'

export type NewsPipelineOptions = {
  category?: string
  country?: string
  page?: number
  keyword?: string
}

function buildArticlePayload(article: NewsArticle, metadata: any) {
  return {
    id: article.id,
    title: article.title,
    description: article.description,
    content: article.content,
    image: article.image,
    source: article.source,
    author: article.author,
    published_at: article.publishedAt,
    category: article.category,
    country: article.country,
    url: article.url,
    summary: metadata.summary,
    tldr: metadata.tldr,
    seo_title: metadata.seoTitle,
    meta_description: metadata.metaDescription,
    keywords: metadata.keywords,
    tags: metadata.tags,
    suggested_category: metadata.suggestedCategory,
    social_caption: metadata.socialCaption,
    imported_at: new Date().toISOString(),
    published: true,
  }
}

async function fetchExistingUrls(urls: string[]) {
  if (!supabaseAdmin) return new Set<string>()
  try {
    const { data, error } = await supabaseAdmin
      .from('news_articles')
      .select('url')
      .in('url', urls)

    if (error) throw error
    return new Set((data || []).map((row: any) => String(row.url)))
  } catch (error) {
    console.warn('Unable to fetch existing news URLs:', error)
    return new Set<string>()
  }
}

async function createNotifications(newArticles: NewsArticle[]) {
  if (!supabaseAdmin || newArticles.length === 0) return 0
  try {
    const payload = newArticles.slice(0, 5).map((article) => ({
      title: `New PulseWire story: ${article.title}`,
      message: `A fresh article is available in your preferred topics: ${article.category}.`,
      metadata: { articleUrl: article.url, category: article.category },
      created_at: new Date().toISOString(),
    }))
    const { error } = await supabaseAdmin.from('notifications').insert(payload)
    if (error) throw error
    return payload.length
  } catch (error) {
    console.warn('Notification queue failed:', error)
    return 0
  }
}

export async function runNewsImportPipeline(options: NewsPipelineOptions = {}) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured')
  }

  const page = options.page || 1
  const country = options.country || 'us'
  const source = options.keyword
    ? await fetchNewsByKeyword(options.keyword, page, country)
    : options.category
      ? await fetchNewsByCategory(options.category, page, country)
      : await fetchLatestNews(page, country)

  const articles = source.articles || []
  const urls = articles.map((article) => article.url)
  const existingUrls = await fetchExistingUrls(urls)
  const newArticles = articles.filter((article) => !existingUrls.has(article.url))

  const saved: any[] = []
  for (const article of newArticles) {
    try {
      const metadata = await generateNewsArticleMetadata(article)
      const payload = buildArticlePayload(article, metadata)
      const { data, error } = await supabaseAdmin.from('news_articles').insert(payload).select('*').single()
      if (error) {
        console.warn('Failed to store news article:', error)
        continue
      }
      saved.push(data)
    } catch (error) {
      console.warn('Failed to process article:', error)
    }
  }

  const notificationsCreated = await createNotifications(newArticles)

  return {
    imported: saved.length,
    scanned: articles.length,
    duplicates: articles.length - newArticles.length,
    notificationsCreated,
    published: saved.length,
    sourceCategory: options.category || null,
    sourceKeyword: options.keyword || null,
    sourceCountry: country,
  }
}
