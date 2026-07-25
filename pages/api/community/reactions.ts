/**
 * API: POST /api/community/reactions
 * Add or update a reaction
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { addReaction } from '../../../lib/community';

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
    const { data, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !data.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { article_id, reaction_type } = req.body;

    if (!article_id || !reaction_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reaction = await addReaction(article_id, data.user.id, reaction_type);

    if (!reaction) {
      return res.status(500).json({ error: 'Failed to add reaction' });
    }

    res.status(201).json({ success: true, data: reaction });
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
