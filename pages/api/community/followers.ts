/**
 * API: POST /api/community/followers
 * Follow/unfollow a user
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { followUser, unfollowUser, isFollowing } from '../../../lib/community';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (req.method === 'POST') {
      const { following_id } = req.body;

      if (!following_id) {
        return res.status(400).json({ error: 'Missing following_id' });
      }

      const success = await followUser(data.user.id, following_id);

      if (!success) {
        return res.status(500).json({ error: 'Failed to follow user' });
      }

      res.status(201).json({ success: true, message: 'Following user' });
    } else if (req.method === 'DELETE') {
      const { following_id } = req.body;

      if (!following_id) {
        return res.status(400).json({ error: 'Missing following_id' });
      }

      const success = await unfollowUser(data.user.id, following_id);

      if (!success) {
        return res.status(500).json({ error: 'Failed to unfollow user' });
      }

      res.status(200).json({ success: true, message: 'Unfollowed user' });
    } else if (req.method === 'GET') {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({ error: 'Missing user_id' });
      }

      const following = await isFollowing(data.user.id, user_id as string);

      res.status(200).json({ success: true, data: { is_following: following } });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Follower error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
