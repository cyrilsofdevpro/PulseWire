import type { NextApiRequest, NextApiResponse } from 'next';
import { generateWithFallback } from '../../../lib/llm';

function formatNumber(value: number | string | undefined) {
  const numeric = typeof value === 'number' ? value : Number(value || 0);
  return numeric.toLocaleString();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, stats } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  const data = stats || {};
  const prompt = `You are PulseWire admin AI. Answer the admin question using only the provided platform stats. Keep it concise, factual, and executive-friendly.

Platform stats:
- Total users: ${formatNumber(data.totalUsers || 0)}
- Active users: ${formatNumber(data.activeUsers || 0)}
- New users today: ${formatNumber(data.newUsersToday || 0)}
- Premium subscribers: ${formatNumber(data.premiumSubscribers || 0)}
- Creator posts: ${formatNumber(data.totalPosts || 0)}
- News articles: ${formatNumber(data.totalArticles || 0)}
- Published news: ${formatNumber(data.publishedArticles || 0)}
- Draft articles: ${formatNumber(data.draftArticles || 0)}
- Breaking stories: ${formatNumber(data.breakingNewsPublished || 0)}
- AI-assisted articles: ${formatNumber(data.aiGeneratedArticles || 0)}
- Comments: ${formatNumber(data.totalComments || 0)}
- Revenue: ${formatNumber(data.revenue || 0)}
- Monthly revenue: ${formatNumber(data.monthlyRevenue || 0)}
- Total revenue: ${formatNumber(data.totalRevenue || 0)}

Instructions:
- If the question asks for a summary, give a short 3-part overview: health, momentum, and priority.
- If the question compares metrics, compare the most relevant numbers and explain what they mean.
- Keep the tone polished and suitable for an admin dashboard.

Question: ${String(question)}`;

  try {
    const llmResponse = await generateWithFallback(prompt, { task: 'chat', max_tokens: 300 });
    if (llmResponse?.text) {
      return res.status(200).json({ answer: llmResponse.text.trim() });
    }
  } catch (error) {
    console.error('Admin AI failed:', error);
  }

  const text = String(question).toLowerCase();
  let answer = 'I can help with live admin questions about users, posts, news, comments, and revenue.';

  if (text.includes('user')) {
    answer = `We currently have ${formatNumber(data.totalUsers || 0)} total users, with ${formatNumber(data.activeUsers || 0)} marked as active and ${formatNumber(data.newUsersToday || 0)} created today.`;
  } else if (text.includes('post') || text.includes('posts')) {
    answer = `There are ${formatNumber(data.totalPosts || 0)} creator posts and ${formatNumber(data.totalArticles || 0)} news articles in the system.`;
  } else if (text.includes('news') || text.includes('article') || text.includes('articles')) {
    answer = `The platform currently has ${formatNumber(data.totalArticles || 0)} news articles, ${formatNumber(data.publishedArticles || 0)} published, ${formatNumber(data.draftArticles || 0)} drafts, and ${formatNumber(data.breakingNewsPublished || 0)} breaking stories.`;
  } else if (text.includes('comment')) {
    answer = `The community has generated ${formatNumber(data.totalComments || 0)} comments so far.`;
  } else if (text.includes('revenue')) {
    answer = `Revenue is currently ${formatNumber(data.revenue || 0)}, with monthly revenue at ${formatNumber(data.monthlyRevenue || 0)} and total revenue at ${formatNumber(data.totalRevenue || 0)}.`;
  } else if (text.includes('active')) {
    answer = `There are ${formatNumber(data.activeUsers || 0)} active users right now.`;
  } else if (text.includes('premium')) {
    answer = `We have ${formatNumber(data.premiumSubscribers || 0)} premium subscribers.`;
  } else if (text.includes('ai')) {
    answer = `There are ${formatNumber(data.aiGeneratedArticles || 0)} AI-assisted articles and ${formatNumber(data.aiAutoPublishedArticles || 0)} AI auto-published items in the platform.`;
  } else {
    answer = `Here is the latest snapshot: ${formatNumber(data.totalUsers || 0)} users, ${formatNumber(data.activeUsers || 0)} active, ${formatNumber(data.totalPosts || 0)} posts, ${formatNumber(data.totalArticles || 0)} news articles, ${formatNumber(data.publishedArticles || 0)} published, and ${formatNumber(data.totalComments || 0)} comments.`;
  }

  return res.status(200).json({ answer });
}
