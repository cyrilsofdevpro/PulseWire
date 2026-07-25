import type { NextApiRequest, NextApiResponse } from 'next'
import { explainFact } from '../../../lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
    const explanation = await explainFact(String(text))
    return res.status(200).json({ explanation })
  } catch (err) {
    console.error('fact route failed:', err)
    return res.status(500).json({ error: 'Fact explanation failed', details: String(err) })
  }
}
