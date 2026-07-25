export type PremiumPlan = 'free' | 'pro' | 'enterprise'

export const PREMIUM_FEATURES = new Set([
  'draft',
  'headline',
  'rewrite',
  'grammar',
  'seo',
  'social',
  'brainstorm',
  'briefing',
  'predictions',
  'podcast',
])

export const PREMIUM_TOOL_LABELS: Record<string, string> = {
  draft: 'Creator Studio',
  headline: 'Headline builder',
  rewrite: 'Rewrite assistant',
  grammar: 'Grammar polish',
  seo: 'SEO optimizer',
  social: 'Social caption',
  brainstorm: 'Story brainstorm',
  briefing: 'Daily briefing',
  predictions: 'Community predictions',
  podcast: 'AI podcast script',
}

export function isPremiumFeature(tool: string) {
  return PREMIUM_FEATURES.has(tool)
}

export function isProPlan(plan?: string): plan is 'pro' | 'enterprise' {
  return plan === 'pro' || plan === 'enterprise'
}

export function getPlanName(plan?: string): PremiumPlan {
  return isProPlan(plan) ? plan : 'free'
}

export function getUpgradeMessage(tool: string) {
  if (tool === 'briefing') return 'Daily AI Briefing is available for PulseWire Pro.'
  if (tool === 'podcast') return 'AI News Podcast scripting is a Pro feature.'
  if (tool === 'brainstorm') return 'Creator Studio access is included in PulseWire Pro.'
  if (tool === 'draft') return 'AI Creator Studio is a Pro-only workflow.'
  return 'This tool requires a PulseWire Pro subscription.'
}
