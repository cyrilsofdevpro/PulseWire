import { supabaseAdmin } from './supabaseAdmin';

let prisma: any | null = null;

async function getPrismaClient() {
  if (typeof window !== 'undefined') return null;
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

async function safeCount(query: string) {
  try {
    const prismaClient = await getPrismaClient();
    if (!prismaClient) return 0;
    const rows = await (prismaClient as any).$queryRawUnsafe(query);
    const firstRow = Array.isArray(rows) ? rows[0] : rows;
    return Number(firstRow?.count || 0);
  } catch {
    return 0;
  }
}

async function supabaseCount(table: string, filter?: (q: any) => any) {
  try {
    if (!supabaseAdmin) return 0
    let q: any = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
    if (filter) q = filter(q)
    const { count, error } = await q
    if (error) {
      console.error('supabaseCount error:', error)
      return 0
    }
    return Number(count || 0)
  } catch (err) {
    return 0
  }
}

export async function getAdminDashboardStats() {
  let users: any[] = [];

  try {
    const response = await supabaseAdmin?.auth.admin.listUsers({ page: 1, perPage: 1000 });
    users = response?.data?.users || [];
  } catch {
    users = [];
  }

  const active = users.filter((user: any) => Boolean(user.last_sign_in_at)).length;
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const newToday = users.filter((user: any) => {
    const createdAt = user.created_at ? new Date(user.created_at) : null;
    return createdAt && createdAt >= startOfDay;
  }).length;

  const premium = users.filter((user: any) => {
    const plan = user.user_metadata?.plan || user.app_metadata?.plan;
    return plan === 'pro' || plan === 'enterprise' || plan === 'premium';
  }).length;

  const free = users.length - premium;

  const [postCount, newsCount, commentCount, publishedArticles, draftArticles, aiGeneratedArticles, userGeneratedArticles, breakingNewsPublished, aiAutoPublishedArticles] = await Promise.all([
    safeCount('SELECT COUNT(*)::int AS count FROM "Post"'),
    // news counts come from the Supabase-backed news_articles table used by the app
    supabaseCount('news_articles'),
    safeCount('SELECT COUNT(*)::int AS count FROM "Comment"'),
    supabaseCount('news_articles', (q: any) => q.eq('published', true)),
    supabaseCount('news_articles', (q: any) => q.eq('published', false)),
    supabaseCount('news_articles', (q: any) => q.neq('summary', '')),
    safeCount('SELECT COUNT(*)::int AS count FROM "Post"'),
    supabaseCount('news_articles', (q: any) => q.eq('category', 'breaking')),
    supabaseCount('news_articles', (q: any) => q.eq('published', true).neq('summary', ''))
  ]);

  // pending manual payments
  const pendingPayments = await supabaseCount('manual_payments', (q: any) => q.eq('status', 'pending'))

  return {
    totalUsers: users.length,
    newUsersToday: newToday,
    activeUsers: active,
    premiumSubscribers: premium,
    freeUsers: free,
    totalArticles: Number(newsCount || 0),
    publishedArticles: Number(publishedArticles || 0),
    draftArticles: Number(draftArticles || 0),
    aiGeneratedArticles: Number(aiGeneratedArticles || 0),
    userGeneratedArticles: Number(userGeneratedArticles || 0),
    breakingNewsPublished: Number(breakingNewsPublished || 0),
    aiAutoPublishedArticles: Number(aiAutoPublishedArticles || 0),
    totalComments: Number(commentCount || 0),
    pendingReports: 0,
    newsCategories: 0,
    aiRequests: 0,
    apiUsage: 0,
    averageReadingTime: 0,
    totalViews: 0,
    monthlyVisitors: 0,
    revenue: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    totalPosts: Number(postCount || 0),
    pendingPayments: Number(pendingPayments || 0)
  };
}

export function formatMetric(value: number | string) {
  const numeric = typeof value === 'number' ? value : Number(value || 0);
  return numeric.toLocaleString();
}
