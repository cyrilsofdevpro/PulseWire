import type { NextApiRequest, NextApiResponse } from 'next'
import { grammarCheck } from '../../../lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
    const corrected = await grammarCheck(String(text))
    return res.status(200).json({ corrected })
  } catch (err) {
    console.error('grammar route failed:', err)
    return res.status(500).json({ error: 'Grammar check failed', details: String(err) })
  }
}
