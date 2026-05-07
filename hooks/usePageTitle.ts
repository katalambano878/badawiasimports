'use client';

import { useEffect } from 'react';
import { useCMS } from '@/context/CMSContext';

export function usePageTitle(title: string) {
  const { getSetting } = useCMS();
  const siteName = getSetting('site_name') || process.env.NEXT_PUBLIC_SITE_NAME || "BADAWIA'S IMPORTS";

  useEffect(() => {
    document.title = title ? `${title} | ${siteName}` : siteName;
  }, [title, siteName]);
}
