'use client';

import { ChatMessage } from '@/lib/api';
import { getAgentConfig } from '@/lib/agentConfig';
import { SourceList } from './SourceCard';

interface AgentMessageGroupProps {
  messages: ChatMessage[];
}

function AgentMessageGroup({ messages }: AgentMessageGroupProps) {
  if (messages.length === 0) return null;

  // 단일 메시지인 경우
  if (messages.length === 1) {
    const message = messages[0];
    const agentConfig = getAgentConfig(message.agent);

    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[80%] bg-muted rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{agentConfig.icon}</span>
            <span className="text-sm font-semibold text-muted-foreground">
              {agentConfig.name}
            </span>
          </div>
          <p className="text-foreground whitespace-pre-wrap">{message.content}</p>

          {/* Retrieved Sources */}
          {message.retrieved_docs && message.retrieved_docs.length > 0 && (
            <SourceList sources={message.retrieved_docs} />
          )}

          <span className="text-xs text-muted-foreground mt-2 block">
            {new Date(message.created_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    );
  }

  // 여러 에이전트의 응답을 하나의 그룹으로 표시
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const agentConfig = getAgentConfig(message.agent);
            return (
              <div
                key={message.id}
                className={`${index !== 0 ? 'pt-4 border-t border-border' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{agentConfig.icon}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {agentConfig.name}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap pl-7">
                  {message.content}
                </p>

                {/* Retrieved Sources */}
                {message.retrieved_docs && message.retrieved_docs.length > 0 && (
                  <div className="pl-7 mt-2">
                    <SourceList sources={message.retrieved_docs} />
                  </div>
                )}
              </div>
            );
          })}
          <span className="text-xs text-muted-foreground block text-right mt-2">
            {new Date(messages[0].created_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AgentMessageGroup;
