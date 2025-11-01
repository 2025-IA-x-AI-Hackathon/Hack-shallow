import { authStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers = {}, ...restOptions } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth && authStore.token) {
    requestHeaders['Authorization'] = `Bearer ${authStore.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API 호출 헬퍼 함수들
export const api = {
  login: async (email: string, password: string) => {
    return apiRequest<{ token: string; user: { id: string; name: string; email: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  },

  sendMessage: async (message: string) => {
    return apiRequest<{ response: string }>(
      '/chat/message',
      {
        method: 'POST',
        body: JSON.stringify({ message }),
        requiresAuth: true,
      }
    );
  },
};
