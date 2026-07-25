const PROJECT_ID = process.env.SANITY_PROJECT_ID
const DATASET = process.env.SANITY_DATASET
const TOKEN = process.env.SANITY_API_TOKEN

const CACHE_TTL = Number(process.env.GROQ_CACHE_TTL_SECONDS || 60) // seconds
const cache = new Map<string, { ts: number; data: any }>()

async function groqFetch(query: string) {
  if (!PROJECT_ID || !DATASET) {
    throw new Error('SANITY_PROJECT_ID and SANITY_DATASET must be set')
  }

  const cacheKey = query
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && now - cached.ts < CACHE_TTL * 1000) return cached.data

  const url = `https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=${encodeURIComponent(
    query
  )}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`

  const maxAttempts = 3
  let attempt = 0
  let lastErr: any = null
  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url, { headers })
      const json = await res.json()
      if (!res.ok) {
        const err = new Error(`GROQ fetch failed: ${res.status} ${res.statusText}`)
        ;(err as any).details = json
        throw err
      }
      cache.set(cacheKey, { ts: Date.now(), data: json.result })
      return json.result
    } catch (err) {
      lastErr = err
      attempt += 1
      const wait = 200 * Math.pow(2, attempt)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}

export async function fetchArticles() {
  const query = `*[_type == "article"] | order(publishedAt desc){_id, title, slug, body, mainImage, publishedAt, "author": author->{name, image}}[0...20]`
  return groqFetch(query)
}

export default groqFetch
