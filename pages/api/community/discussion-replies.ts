/**
 * API: POST /api/community/discussion-replies
 * Create a new discussion reply
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { addDiscussionReply } from '../../../lib/community';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    const { data, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !data.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { discussion_id, content, parent_reply_id } = req.body;
    if (!discussion_id || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reply = await addDiscussionReply(discussion_id, data.user.id, content, parent_reply_id);
    if (!reply) {
      return res.status(500).json({ error: 'Failed to create reply' });
    }

    return res.status(201).json({ success: true, data: reply });
  } catch (error) {
    console.error('Error creating discussion reply:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
