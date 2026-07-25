import type { NextApiRequest, NextApiResponse } from 'next'
import { runNewsImportPipeline } from '../../../services/news/newsPipeline'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { category, keyword, country, page } = req.body || {}
    const result = await runNewsImportPipeline({ category, keyword, country, page })
    return res.status(200).json(result)
  } catch (error: any) {
    console.error('News ingestion failed:', error)
    return res.status(500).json({ error: error?.message || 'Unable to ingest news' })
  }
}
