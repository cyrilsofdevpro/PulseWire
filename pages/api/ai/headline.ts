import type { NextApiRequest, NextApiResponse } from 'next'
import { generateHeadline } from '../../../lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
    const headline = await generateHeadline(String(text))
    return res.status(200).json({ headline })
  } catch (err) {
    console.error('headline route failed:', err)
    return res.status(500).json({ error: 'Headline generation failed', details: String(err) })
  }
}
