'use client';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { chatStore } from '@/stores/chatStore';

function MessageInput() {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatStore.isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // ChatStore의 sendMessage 메서드 사용
    await chatStore.sendMessage(userMessage);
  };

  const isDisabled = !chatStore.currentDogId || chatStore.isLoading;

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-4 bg-card">
      {chatStore.error && (
        <div className="mb-2 p-2 bg-destructive/10 text-destructive text-sm rounded-md">
          {chatStore.error}
        </div>
      )}
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isDisabled}
          className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={
            !chatStore.currentDogId
              ? '강아지를 선택해주세요...'
              : chatStore.isLoading
              ? 'AI가 응답 중입니다...'
              : '메시지를 입력하세요...'
          }
        />
        <button
          type="submit"
          disabled={!input.trim() || isDisabled}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {chatStore.isLoading ? '전송 중...' : '전송'}
        </button>
      </div>
    </form>
  );
}

export default observer(MessageInput);
