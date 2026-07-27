/**
 * pages/community/index.tsx
 * Community landing page redirects or links to discussions.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CommunityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/community/discussions');
  }, [router]);

  return null;
}
