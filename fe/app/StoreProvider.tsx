'use client';

import { ReactNode, useEffect } from 'react';
import { authStore } from '@/stores/authStore';

export default function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Hydrate authStore from localStorage on app mount (client-side only)
    authStore.hydrate();
  }, []);

  return <>{children}</>;
}
