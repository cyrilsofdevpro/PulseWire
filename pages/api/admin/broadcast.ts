import type { NextApiRequest, NextApiResponse } from 'next';
import { generateWithFallback } from '../../../lib/llm';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function formatNumber(value: number | string | undefined) {
  const numeric = typeof value === 'number' ? value : Number(value || 0);
  return numeric.toLocaleString();
}

function cleanText(value: string | undefined) {
  return String(value || '').trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action = 'draft', title, message, audience = 'all', tone = 'professional', stats } = req.body || {};
  const safeTitle = cleanText(title);
  const safeMessage = cleanText(message);
  const safeAudience = String(audience || 'all');
  const safeTone = String(tone || 'professional');

  const data = stats || {};
  const prompt = `You are PulseWire admin communications assistant. Draft a polished broadcast announcement for the platform.

Audience: ${safeAudience}
Tone: ${safeTone}
Suggested title: ${safeTitle || 'PulseWire update'}
Current platform snapshot:
- Users: ${formatNumber(data.totalUsers || 0)}
- Active users: ${formatNumber(data.activeUsers || 0)}
- Premium subscribers: ${formatNumber(data.premiumSubscribers || 0)}
- Creator posts: ${formatNumber(data.totalPosts || 0)}
- News articles: ${formatNumber(data.totalArticles || 0)}
- Published news: ${formatNumber(data.publishedArticles || 0)}
- Total comments: ${formatNumber(data.totalComments || 0)}
- Revenue: ${formatNumber(data.revenue || 0)}

Instructions:
- Write a concise, executive-friendly message the admin can send immediately.
- Mention the most relevant number from the snapshot.
- Keep it under 180 words.
- If a message is already provided, refine it instead of repeating it.

Existing message: ${safeMessage || 'None'}`;

  try {
    const llmResponse = await generateWithFallback(prompt, { task: 'social', max_tokens: 220 });
    const draftText = cleanText(llmResponse?.text || '');

    if (action === 'send') {
      const finalMessage = safeMessage || draftText || `PulseWire is rolling out a new update for ${safeAudience} today.`;
      const finalTitle = safeTitle || `PulseWire ${safeAudience === 'all' ? 'update' : safeAudience} announcement`;

      let saved = false;
      let saveError: string | null = null;

      if (supabaseAdmin) {
        try {
          const { error } = await supabaseAdmin.from('notifications').insert([
            {
              title: finalTitle,
              message: finalMessage,
              type: 'Admin announcement',
              created_at: new Date().toISOString(),
            },
          ]);
          if (!error) saved = true;
          else saveError = error.message || 'Unable to save broadcast';
        } catch (error: any) {
          saveError = error?.message || 'Unable to save broadcast';
        }
      }

      return res.status(200).json({ ok: true, title: finalTitle, message: finalMessage, saved, saveError });
    }

    return res.status(200).json({ ok: true, title: safeTitle || 'PulseWire update', draft: draftText || safeMessage || 'PulseWire is rolling out a new update for your audience today.' });
  } catch (error: any) {
    console.error('Broadcast AI failed:', error);
    const fallbackDraft = safeMessage || `PulseWire is rolling out a new update for ${safeAudience} today. We are keeping the experience fast, useful, and community-first.`;
    if (action === 'send') {
      return res.status(200).json({ ok: true, title: safeTitle || 'PulseWire update', message: fallbackDraft, saved: false, saveError: 'AI drafting unavailable' });
    }
    return res.status(200).json({ ok: true, title: safeTitle || 'PulseWire update', draft: fallbackDraft });
  }
}
