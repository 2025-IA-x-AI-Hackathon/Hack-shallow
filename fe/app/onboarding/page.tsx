'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { authStore } from '@/stores/authStore';
import { api } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkDogsExist = async () => {
      // authStore hydration이 완료될 때까지 대기
      if (!authStore.isHydrated) {
        return;
      }

      // 인증 확인
      if (!authStore.isAuthenticated || !authStore.userId) {
        router.push('/login');
        return;
      }

      try {
        // 이미 강아지가 있는지 확인
        const dogs = await api.getDogs(authStore.userId);
        if (dogs.length > 0) {
          // 이미 강아지가 있으면 채팅 페이지로 리다이렉트
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Failed to check dogs:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkDogsExist();
  }, [router, authStore.isHydrated]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <OnboardingFlow />
    </div>
  );
}
