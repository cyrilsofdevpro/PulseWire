const NEWSDATA_API_URL = 'https://newsdata.io/api/1/news'
const CACHE_TTL = 1000 * 60 * 2
const cache = new Map<string, { expiresAt: number; data: any }>()

export const NEWS_CATEGORIES = [
  'Technology',
  'AI',
  'Business',
  'Crypto',
  'Finance',
  'Politics',
  'Sports',
  'Entertainment',
  'Science',
  'Health',
  'World',
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export type NewsArticle = {
  id: string
  title: string
  description: string
  content: string
  image: string | null
  source: string | null
  author: string | null
  publishedAt: string | null
  category: NewsCategory
  country: string | null
  url: string
}

export type NewsListResponse = {
  articles: NewsArticle[]
  nextPage: number | null
  totalResults: number | null
}

function safeString(value: unknown) {
  return String(value ?? '').trim()
}

function hashValue(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    const char = value.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return `news-${Math.abs(hash)}`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getCacheKey(url: string) {
  return url
}

function setCache(key: string, data: any, ttl = CACHE_TTL) {
  cache.set(key, { data, expiresAt: Date.now() + ttl })
}

function getCache(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function normalizeCategory(value: unknown): NewsCategory {
  const raw = safeString(value).toLowerCase()
  const map: Record<string, NewsCategory> = {
    technology: 'Technology',
    tech: 'Technology',
    ai: 'AI',
    artificialintelligence: 'AI',
    business: 'Business',
    crypto: 'Crypto',
    cryptocurrency: 'Crypto',
    finance: 'Finance',
    politics: 'Politics',
    political: 'Politics',
    sports: 'Sports',
    entertainment: 'Entertainment',
    science: 'Science',
    health: 'Health',
    world: 'World',
    worldnews: 'World',
  }

  const normalized = map[raw] || NEWS_CATEGORIES.find((category) => category.toLowerCase() === raw)
  return normalized || 'World'
}

function normalizeArticle(raw: any, categoryOverride?: string): NewsArticle {
  const title = safeString(raw.title || raw.headline || raw.description || raw.content)
  const description = safeString(raw.description || raw.content || raw.title)
  const content = safeString(raw.content || raw.description || raw.title)
  const url = safeString(raw.link || raw.url || raw.source_url || raw.source)
  const publishedAt = safeString(raw.pubDate || raw.pubDateTime || raw.date || raw.published_at)
  const category = normalizeCategory(categoryOverride || raw.category || (Array.isArray(raw.category) ? raw.category[0] : raw.category))
  const image = safeString(raw.image_url || raw.image || raw.media) || null
  const source = safeString(raw.source_id || raw.source || raw.source_name) || null
  const author = Array.isArray(raw.creator) ? safeString(raw.creator[0]) : safeString(raw.creator || raw.author) || null
  const country = Array.isArray(raw.country) ? safeString(raw.country[0]) : safeString(raw.country) || null
  const idSource = url || `${title}-${publishedAt}`
  const id = hashValue(idSource)

  return {
    id,
    title: title || 'Untitled news article',
    description: description || title || 'No description available.',
    content: content || description || title,
    image,
    source,
    author,
    publishedAt: publishedAt || null,
    category,
    country: country || null,
    url: url || idSource,
  }
}

async function fetchWithRetry(url: string, retries = 2, backoff = 500) {
  let lastError: any
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) {
        const detail = json?.message || json?.error || JSON.stringify(json)
        throw new Error(`NewsData request failed ${res.status}: ${detail}`)
      }
      return json
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await sleep(backoff * (attempt + 1))
      }
    }
  }
  throw lastError
}

async function fetchNewsData(params: Record<string, string | number | boolean | undefined>) {
  const apiKey = safeString(process.env.NEWSDATA_API_KEY)
  if (!apiKey) {
    throw new Error('Missing NEWSDATA_API_KEY in environment')
  }

  const url = new URL(NEWSDATA_API_URL)
  url.searchParams.set('apikey', apiKey)
  url.searchParams.set('language', String(params.language || 'en'))

  const page = Number(params.page || 0)
  if (page > 1) url.searchParams.set('page', String(page))
  if (params.category) url.searchParams.set('category', String(params.category))
  if (params.country) url.searchParams.set('country', String(params.country))
  if (params.q) url.searchParams.set('q', String(params.q))
  if (params.search) url.searchParams.set('q', String(params.search))
  if (params.sortBy) url.searchParams.set('sort_by', String(params.sortBy))

  const cacheKey = getCacheKey(url.toString())
  const cached = getCache(cacheKey)
  if (cached) return cached

  const json = await fetchWithRetry(url.toString())
  const results = Array.isArray(json.results) ? json.results : []
  const articles = results.map((item: any) => normalizeArticle(item, String(params.category || '')))
  const response = {
    articles,
    nextPage: typeof json.nextPage === 'number' ? json.nextPage : json.next_page ? Number(json.next_page) : null,
    totalResults: typeof json.totalResults === 'number' ? json.totalResults : json.total_results ? Number(json.total_results) : null,
  }

  setCache(cacheKey, response)
  return response
}

export async function fetchLatestNews(page = 1, country = 'us') {
  return fetchNewsData({ page, country })
}

export async function fetchBreakingNews(page = 1, country = 'us') {
  return fetchNewsData({ q: 'breaking', category: 'World', page, country })
}

export async function fetchTrendingNews(page = 1, country = 'us') {
  return fetchNewsData({ q: 'trending', page, country })
}

export async function fetchNewsByCategory(category: string, page = 1, country = 'us') {
  const normalizedCategory = normalizeCategory(category)
  return fetchNewsData({ category: normalizedCategory, page, country })
}

export async function fetchNewsByCountry(country: string, page = 1) {
  return fetchNewsData({ country, page })
}

export async function fetchNewsByKeyword(keyword: string, page = 1, country = 'us') {
  return fetchNewsData({ q: keyword, page, country })
}

export async function searchNews(query: string, page = 1, category?: string, country = 'us') {
  const searchParams: any = { q: query, page, country }
  if (category) searchParams.category = category
  return fetchNewsData(searchParams)
}

export async function fetchNewsPage(page = 1, category?: string, country = 'us') {
  return category ? fetchNewsByCategory(category, page, country) : fetchLatestNews(page, country)
}
