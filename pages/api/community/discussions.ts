/**
 * API: GET /api/community/discussions
 * List or create discussions
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getDiscussions, createDiscussion } from '../../../lib/community';
import { summarizeWithAi, suggestTags, moderateContent } from '../../../lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const discussions = await getDiscussions();
      return res.status(200).json({ success: true, data: discussions });
    } catch (error) {
      console.error('Error fetching discussions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.replace('Bearer ', '');
      console.log('Incoming Authorization header (trim):', authHeader?.slice?.(0,200));
      console.log('Supabase admin configured?', !!supabaseAdmin);

      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server misconfiguration' });
      }

      let authResult;
      try {
        authResult = await supabaseAdmin.auth.getUser(token);
      } catch (e) {
        console.error('supabaseAdmin.auth.getUser threw:', e);
        authResult = { error: e, data: null } as any;
      }

      console.log('supabaseAdmin.getUser result:', authResult);

      const data = authResult?.data;
      const authError = authResult?.error;

      if (authError || !data?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, content, category } = req.body;
      if (!title || !content || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Run AI helpers (summary, tags, moderation) but don't fail creation on AI errors
      let aiSummary = '';
      let suggestedTags: string[] = [];
      let moderation: any = null;
      try {
        aiSummary = await summarizeWithAi(content);
      } catch (e) {
        console.warn('AI summary failed:', e);
      }

      try {
        suggestedTags = await suggestTags(content);
      } catch (e) {
        console.warn('AI suggestTags failed:', e);
      }

      try {
        moderation = await moderateContent(content);
      } catch (e) {
        console.warn('AI moderateContent failed:', e);
      }

      const discussion = await createDiscussion(data.user.id, title, content, category, data.user, {
        ai_summary: aiSummary,
        suggested_tags: suggestedTags,
        moderation,
      });
      if (!discussion) {
        return res.status(500).json({ error: 'Failed to create discussion' });
      }

      const responseData = {
        ...discussion,
        ai_summary: aiSummary,
        suggested_tags: suggestedTags,
        moderation,
      };

      return res.status(201).json({ success: true, data: responseData });
    } catch (error) {
      console.error('Error creating discussion:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
