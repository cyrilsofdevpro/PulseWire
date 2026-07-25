import type { NextApiRequest, NextApiResponse } from 'next'
import { translateText } from '../../../lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { text, targetLanguage = 'Spanish' } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  try {
    const translation = await translateText(String(text), String(targetLanguage))
    return res.status(200).json({ translation, fallback: !translation || translation === String(text).trim() })
  } catch (err) {
    console.error('translate route failed:', err)
    return res.status(200).json({ translation: String(text), fallback: true })
  }
}
