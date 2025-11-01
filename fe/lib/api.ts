import { authStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shallow-mind-be.hyki.me';

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

// API Response Types
export interface Dog {
  id: number;
  name: string;
  breed: string;
  birth_date: string;
  sex: string;
  neutered: boolean;
  weight_kg: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  dog_id: number;
  role: 'user' | 'assistant';
  content: string;
  agent: string | null;
  created_at: string;
}

export interface ChatMessageCreate {
  role: 'user' | 'assistant';
  content: string;
  agent?: string | null;
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

  // Dog Management
  getDogs: async (userId: number) => {
    return apiRequest<Dog[]>(
      `/v1/users/${userId}/dogs`,
      {
        method: 'GET',
        requiresAuth: true,
      }
    );
  },

  // Chat Messages
  getChatMessages: async (dogId: number, limit = 100) => {
    return apiRequest<ChatMessage[]>(
      `/v1/dogs/${dogId}/chat/messages?limit=${limit}`,
      {
        method: 'GET',
        requiresAuth: true,
      }
    );
  },

  sendChatMessage: async (dogId: number, content: string) => {
    const payload: ChatMessageCreate = {
      role: 'user',
      content,
      agent: null,
    };
    return apiRequest<ChatMessage>(
      `/v1/dogs/${dogId}/chat/messages`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        requiresAuth: true,
      }
    );
  },
};
