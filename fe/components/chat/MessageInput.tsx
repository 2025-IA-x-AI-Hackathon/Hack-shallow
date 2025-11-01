'use client';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { chatStore } from '@/stores/chatStore';
import { api } from '@/lib/api';

interface MessageInputProps {
  onSend?: (message: string) => void;
}

function MessageInput({ onSend }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatStore.isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // 사용자 메시지 추가
    chatStore.addMessage({
      content: userMessage,
      role: 'user',
    });

    // API 호출 전 로딩 상태 설정
    chatStore.setLoading(true);

    try {
      // API 호출 (실제 구현 시 백엔드와 연동)
      const response = await api.sendMessage(userMessage);

      // AI 응답 추가
      chatStore.addMessage({
        content: response.response,
        role: 'assistant',
      });

      onSend?.(userMessage);
    } catch (error) {
      // 에러 메시지 표시
      chatStore.addMessage({
        content: '죄송합니다. 메시지를 전송하는 중 오류가 발생했습니다.',
        role: 'assistant',
      });
    } finally {
      chatStore.setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={chatStore.isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder={chatStore.isLoading ? 'AI가 응답 중입니다...' : '메시지를 입력하세요...'}
        />
        <button
          type="submit"
          disabled={!input.trim() || chatStore.isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {chatStore.isLoading ? '전송 중...' : '전송'}
        </button>
      </div>
    </form>
  );
}

export default observer(MessageInput);
