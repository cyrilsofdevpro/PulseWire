/**
 * API: GET /api/community/profiles/[username]
 * Get profile by username
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getProfileByUsername, getFollowers } from '../../../../lib/community';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Missing username' });
    }

    const profile = await getProfileByUsername(username as string);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get followers if requested
    let followers = [];
    if (req.query.include_followers === 'true') {
      followers = await getFollowers(profile.id, 10);
    }

    res.status(200).json({
      success: true,
      data: {
        profile,
        followers: followers.length > 0 ? followers : undefined,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
