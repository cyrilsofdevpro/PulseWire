/**
 * API: GET /api/community/notifications
 * Get user notifications
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getNotifications, markNotificationAsRead } from '../../../lib/community';

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

    if (req.method === 'GET') {
      const { limit = 20, unread_only = false } = req.query;

      const notifications = await getNotifications(
        data.user.id,
        parseInt(limit as string),
        unread_only === 'true'
      );

      res.status(200).json({ success: true, data: notifications });
    } else if (req.method === 'POST') {
      const { notification_id } = req.body;

      if (!notification_id) {
        return res.status(400).json({ error: 'Missing notification_id' });
      }

      const success = await markNotificationAsRead(notification_id);

      if (!success) {
        return res.status(500).json({ error: 'Failed to mark notification as read' });
      }

      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
