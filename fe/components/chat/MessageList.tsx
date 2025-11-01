'use client';

import { observer } from 'mobx-react-lite';
import { chatStore, Message } from '@/stores/chatStore';
import { useEffect, useRef } from 'react';

function MessageList() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatStore.messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {chatStore.messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          메시지를 입력하여 대화를 시작하세요
        </div>
      ) : (
        <>
          {chatStore.messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

export default observer(MessageList);
