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
    let message = '요청 처리 중 오류가 발생했습니다.';
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {}

    if (payload) {
      if (typeof payload.detail === 'string') {
        message = payload.detail;
      } else if (Array.isArray(payload.detail)) {
        message = payload.detail.map((e: any) => e?.msg || e?.detail || JSON.stringify(e)).join('\n');
      } else if (payload.message) {
        message = payload.message;
      }
    }

    // 상태코드별 가독성 향상
    if (response.status === 400 && !message) message = '입력값을 다시 확인해주세요.';
    if (response.status === 401 && !message) message = '인증이 필요하거나 정보가 올바르지 않습니다.';
    if (response.status === 403 && !message) message = '권한이 없습니다.';
    if (response.status === 404 && !message) message = '요청한 리소스를 찾을 수 없습니다.';
    if (response.status === 409 && !message) message = '이미 존재합니다.';
    if (response.status >= 500 && !message) message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

    throw new Error(message);
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

// Dog Info Types
export interface DogInfoRandomQuestion {
  category: string;
  key: string;
  question: string;
  question_type: 'boolean' | 'text';
}

export interface DogInfoAnswerUpdate {
  answer: string;
  source?: string;
}

export interface DogInfoAutoFillUpdate {
  id: number;
  dog_id: number;
  category: string;
  key: string;
  question: string;
  question_type: string;
  answer_text: string;
  source: string;
  updated_at: string;
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

    // Dog Info - Proactive Questions
  getRandomUnansweredQuestion: async (dogId: number) => {
    return apiRequest<DogInfoRandomQuestion>(
      `/v1/dogs/${dogId}/info/random-unanswered`,
      {
        method: 'GET',
        requiresAuth: true,
      }
    );
  },

  // Dog Info - Auto-fill from history
  autoFillDogInfoFromHistory: async (dogId: number) => {
    return apiRequest<DogInfoAutoFillUpdate[]>(
      `/v1/dogs/${dogId}/info/auto-fill-from-history`,
      {
        method: 'POST',
        requiresAuth: true,
      }
    );
  },

  // Dog Info - Save answer
  saveDogInfoAnswer: async (dogId: number, key: string, answer: string, source = 'user') => {
    const payload: DogInfoAnswerUpdate = {
      answer,
      source,
    };
    return apiRequest<void>(
      `/v1/dogs/${dogId}/info/${key}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
        requiresAuth: true,
      }
    );
  },

  // Reports (Markdown/PDF)
  createReportMarkdown: async (dogId: number) => {
    return apiRequest<{ ok: boolean; filename: string; url_md: string; url_pdf: string }>(
      `/v1/dogs/${dogId}/reports/md`,
      { method: 'POST', requiresAuth: true }
    );
  },

  listReports: async (dogId: number) => {
    return apiRequest<Array<{ filename: string; url_md: string; url_pdf: string; modified: number }>>(
      `/v1/dogs/${dogId}/reports`,
      { method: 'GET', requiresAuth: true }
    );
  }
};
