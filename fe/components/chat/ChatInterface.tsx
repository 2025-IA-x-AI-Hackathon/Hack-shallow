'use client';

import { observer } from 'mobx-react-lite';
import { authStore } from '@/stores/authStore';
import { chatStore } from '@/stores/chatStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DogSelector from './DogSelector';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function ChatInterface() {
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      // 인증되지 않은 경우 로그인 페이지로 이동
      if (!authStore.isAuthenticated || !authStore.username) {
        router.push('/login');
        return;
      }

      // 강아지 목록 로드
      await chatStore.loadDogs(authStore.username);

      // 첫 번째 강아지가 자동 선택되면 메시지 로드
      if (chatStore.currentDogId) {
        await chatStore.loadMessages();
      }
    };

    initialize();
  }, [router]);

  const handleLogout = () => {
    authStore.logout();
    chatStore.clearMessages();
    router.push('/login');
  };

  // 로딩 상태
  if (chatStore.isLoading && chatStore.dogs.length === 0) {
    return (
      <div className="flex flex-col h-screen max-w-6xl mx-auto bg-background">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (chatStore.error && chatStore.dogs.length === 0) {
    return (
      <div className="flex flex-col h-screen max-w-6xl mx-auto bg-background">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-destructive mb-4">{chatStore.error}</p>
            <button
              onClick={() => authStore.username && chatStore.loadDogs(authStore.username)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-background shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div>
          <h1 className="text-xl font-bold text-foreground">반려견 건강 AI 상담</h1>
          {authStore.username && (
            <p className="text-sm text-muted-foreground">{authStore.username}님, 환영합니다!</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 강아지 선택 */}
      <DogSelector />

      {/* 메시지 영역 */}
      <MessageList />

      {/* 입력 영역 */}
      <MessageInput />
    </div>
  );
}

export default observer(ChatInterface);
