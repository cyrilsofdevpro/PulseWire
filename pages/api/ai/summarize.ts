import type { NextApiRequest, NextApiResponse } from 'next'
import { summarizeWithAi } from '../../../lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
    const summary = await summarizeWithAi(String(text))
    return res.status(200).json({ summary, fallback: !summary || summary === String(text).trim().slice(0, 300) })
  } catch (err) {
    console.error('summarize route failed:', err)
    const fallback = String(text).trim().slice(0, 300)
    return res.status(200).json({ summary: fallback, fallback: true })
  }
}
