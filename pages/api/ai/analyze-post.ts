import type { NextApiRequest, NextApiResponse } from 'next'
import { analyzeWithAi } from '../../../lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
    const llmAnalysis = await analyzeWithAi(String(text))
    return res.status(200).json({ llmAnalysis: { text: llmAnalysis } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'AI analysis error', details: String(err) })
  }
}
