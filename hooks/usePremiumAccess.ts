import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getPlanName, isProPlan, PremiumPlan } from '../lib/premium'

export function usePremiumAccess() {
  const [plan, setPlan] = useState<PremiumPlan>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadPlan() {
      try {
        if (!supabase) {
          setPlan('free')
          return
        }

        const { data } = await supabase.auth.getUser()
        const user = data?.user
        const planFromUser = (user?.user_metadata as any)?.plan || (user?.app_metadata as any)?.plan

        let planValue = planFromUser

        if (!planValue && user) {
          const { data: refreshedData } = await supabase.auth.refreshSession()
          const refreshedUser = refreshedData?.user || refreshedData?.session?.user
          planValue = (refreshedUser?.user_metadata as any)?.plan || (refreshedUser?.app_metadata as any)?.plan
        }

        const resolvedPlan = getPlanName(planValue)
        if (mounted) setPlan(resolvedPlan)
      } catch (error) {
        if (mounted) setPlan('free')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPlan()
    return () => {
      mounted = false
    }
  }, [])

  return {
    plan,
    loading,
    isPro: isProPlan(plan),
  }
}
