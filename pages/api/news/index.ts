import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchNewsPage, searchNews } from '../../../services/news/newsData'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { category, keyword, country, page, q } = req.query
    const pageNumber = Number(page || 1)
    const countryCode = String(country || 'us')
    const searchQuery = String(q || keyword || '')
    const categoryParam = category ? String(category) : undefined

    const response = searchQuery
      ? await searchNews(searchQuery, pageNumber, categoryParam, countryCode)
      : await fetchNewsPage(pageNumber, categoryParam, countryCode)

    return res.status(200).json(response)
  } catch (error: any) {
    console.error('News fetch failed:', error)
    return res.status(500).json({ error: error?.message || 'Unable to fetch news' })
  }
}
