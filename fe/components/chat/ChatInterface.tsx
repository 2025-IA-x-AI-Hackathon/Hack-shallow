'use client';

import { observer } from 'mobx-react-lite';
import { authStore } from '@/stores/authStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useRouter } from 'next/navigation';

function ChatInterface() {
  const router = useRouter();

  const handleLogout = () => {
    authStore.logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-white shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-bold">AI 채팅</h1>
          {authStore.username && (
            <p className="text-sm text-gray-600">{authStore.username}님, 환영합니다!</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 메시지 영역 */}
      <MessageList />

      {/* 입력 영역 */}
      <MessageInput />
    </div>
  );
}

export default observer(ChatInterface);
