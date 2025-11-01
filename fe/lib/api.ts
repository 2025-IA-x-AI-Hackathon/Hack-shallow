import { authStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to decode JWT token
function decodeJWT(token: string): { sub: number } {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

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
  retrieved_docs?: RetrievedDoc[]; // Optional: only present in frontend memory, not saved to DB
}

export interface ChatMessageCreate {
  role: 'user' | 'assistant';
  content: string;
  agent?: string | null;
}

// Multi-Agent Response Types
export interface RetrievedDoc {
  source: string;
  page: number | string | null;
  snippet: string;
}

export interface AgentResult {
  agent: string;
  question: string;
  answer: string;
  retrieved_docs: RetrievedDoc[];
  duration_ms: number;
  started_at: number;
  ended_at: number;
}

export interface MultiAgentResponse {
  answer: string;
  tasks?: any[];
  results: AgentResult[];
}

// API 호출 헬퍼 함수들
export const api = {
  signup: async (username: string, password: string) => {
    const response = await apiRequest<{ id: number; username: string; created_at: string; updated_at: string }>(
      '/v1/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
    return { ...response, userId: response.id };
  },

  login: async (username: string, password: string) => {
    const response = await apiRequest<{ access_token: string; token_type: string }>(
      '/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
    const decoded = decodeJWT(response.access_token);
    return { ...response, userId: decoded.sub };
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

  sendChatMessage: async (
    dogId: number,
    content: string,
    role: 'user' | 'assistant' = 'user',
    agent: string | null = null
  ) => {
    const payload: ChatMessageCreate = {
      role,
      content,
      agent,
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

  // Multi-Agent Chat
  sendMultiAgentMessage: async (question: string, dogId: number) => {
    return apiRequest<MultiAgentResponse>(
      '/v1/api/message',
      {
        method: 'POST',
        body: JSON.stringify({ message: question, dog_id: dogId }),
        requiresAuth: true,
      }
    );
  },
};
