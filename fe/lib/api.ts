import { authStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  signup: async (username: string, password: string) => {
    return apiRequest<{ id: number; username: string; created_at: string; updated_at: string }>(
      '/v1/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
  },

  login: async (username: string, password: string) => {
    return apiRequest<{ access_token: string; token_type: string }>(
      '/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
  },

  createDog: async (dogData: {
    name: string;
    breed?: string;
    birth_date?: string;
    sex?: 'male' | 'female' | 'unknown';
    neutered?: boolean;
    weight_kg?: number;
  }) => {
    return apiRequest<{
      id: number;
      user_id: number;
      name: string;
      breed?: string;
      birth_date?: string;
      sex?: string;
      neutered?: boolean;
      weight_kg?: number;
      created_at: string;
      updated_at: string;
    }>(
      '/v1/dogs',
      {
        method: 'POST',
        body: JSON.stringify(dogData),
        requiresAuth: true,
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
