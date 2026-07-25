import type { NextApiRequest, NextApiResponse } from 'next'
import { runAiTool } from '../../../lib/aiService'

type ApiResponse = {
  result?: string
  summary?: string
  translation?: string
  analysis?: string
  headline?: string
  rewritten?: string
  corrected?: string
  seo?: string
  social?: string
  brainstorm?: string
  briefing?: string
  predictions?: string
  podcast?: string
  explanation?: string
  sentiment?: string
  answer?: string
  category?: string
  tags?: string[]
  moderation?: any
  matches?: any[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse | { error: string }>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { tool, ...payload } = req.body || {}
  if (!tool || typeof tool !== 'string') {
    return res.status(400).json({ error: 'tool is required' })
  }

  try {
    const data = await runAiTool(tool as any, payload)
    const response: ApiResponse = { result: data.result }

    if (tool === 'chat') {
      response.answer = data.result
      response.summary = data.summary
      response.category = data.category
      response.tags = data.tags
      response.moderation = data.moderation
      response.matches = data.matches
    }

    if (tool === 'summarize') response.summary = data.summary
    if (tool === 'translate') response.translation = data.translation
    if (tool === 'analysis') response.analysis = data.analysis
    if (tool === 'headline') response.headline = data.headline
    if (tool === 'rewrite' || tool === 'draft') response.rewritten = data.rewritten
    if (tool === 'grammar') response.corrected = data.corrected
    if (tool === 'seo') response.seo = data.seo
    if (tool === 'social') response.social = data.social
    if (tool === 'brainstorm') response.brainstorm = data.brainstorm
    if (tool === 'briefing') response.briefing = data.briefing
    if (tool === 'predictions') response.predictions = data.predictions
    if (tool === 'podcast') response.podcast = data.podcast
    if (tool === 'facts') response.explanation = data.explanation
    if (tool === 'sentiment') response.sentiment = data.sentiment

    return res.status(200).json(response)
  } catch (error) {
    console.error('AI tool error:', error)
    return res.status(500).json({ error: 'AI tool failed' })
  }
}
