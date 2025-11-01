'use client';

import { observer } from 'mobx-react-lite';
import { chatStore } from '@/stores/chatStore';
import { ChatMessage } from '@/lib/api';
import { useEffect, useRef } from 'react';
import AgentMessageGroup from './AgentMessageGroup';
import { MultiAgentMessageGroup } from './MultiAgentMessageGroup';
import { LoadingIndicator } from './LoadingIndicator';
import { User } from 'lucide-react';

function MessageList() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatStore.messages]);

  // 메시지를 그룹화: 연속된 assistant 메시지를 하나의 그룹으로
  const groupMessages = (messages: ChatMessage[]) => {
    const groups: { type: 'user' | 'assistant'; messages: ChatMessage[] }[] = [];
    let currentGroup: ChatMessage[] = [];
    let currentRole: 'user' | 'assistant' | null = null;

    messages.forEach((message) => {
      if (message.role !== currentRole) {
        if (currentGroup.length > 0 && currentRole) {
          groups.push({ type: currentRole, messages: currentGroup });
        }
        currentGroup = [message];
        currentRole = message.role;
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0 && currentRole) {
      groups.push({ type: currentRole, messages: currentGroup });
    }

    return groups;
  };

  const messageGroups = groupMessages(chatStore.messages);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {chatStore.messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p className="text-lg mb-2">🐕 반려견 건강 상담을 시작해보세요</p>
            <p className="text-sm">궁금한 점을 자유롭게 물어보세요!</p>
          </div>
        </div>
      ) : (
        <>
          {messageGroups.map((group, groupIndex) => {
            if (group.type === 'user') {
              // 사용자 메시지는 개별적으로 표시 (프로필 아이콘 포함)
              return group.messages.map((message) => (
                <div key={message.id} className="flex justify-end mb-4 gap-2">
                  <div className="max-w-[70%] px-4 py-2 rounded-lg bg-primary text-primary-foreground">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-80 mt-1 block">
                      {new Date(message.created_at).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                </div>
              ));
            } else {
              // Assistant messages - 단순 텍스트로 저장됨 (frontend.html과 동일)
              return <AgentMessageGroup key={groupIndex} messages={group.messages} />;
            }
          })}

          {/* Loading Indicator */}
          {chatStore.loadingPhase && (
            <LoadingIndicator
              phase={chatStore.loadingPhase}
              activeAgents={chatStore.activeAgents}
              completedAgents={chatStore.completedAgents}
            />
          )}

          {/* Show pending multi-agent results during loading */}
          {chatStore.pendingResults && chatStore.pendingResults.length > 0 && (
            <MultiAgentMessageGroup
              results={chatStore.pendingResults}
              timestamp={new Date().toISOString()}
            />
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

export default observer(MessageList);
