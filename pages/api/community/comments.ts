/**
 * API: POST /api/community/comments
 * Create a new comment
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { createComment, addActivityFeedItem } from '../../../lib/community';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !data.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { article_id, content, parent_comment_id, mentions } = req.body;

    if (!article_id || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const comment = await createComment(article_id, data.user.id, content, parent_comment_id);

    if (!comment) {
      return res.status(500).json({ error: 'Failed to create comment' });
    }

    // Add to activity feed
    await addActivityFeedItem(
      data.user.id,
      'commented',
      'New comment',
      `Commented on an article`,
      article_id,
      { mentions }
    );

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
