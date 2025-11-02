'use client';

import { getAgentConfig } from '@/lib/agentConfig';
import { CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export type LoadingPhase = 'analyzing' | 'routing' | 'responding';

interface LoadingIndicatorProps {
  phase: LoadingPhase;
  activeAgents?: string[];
  completedAgents?: string[];
  messages?: string[]; // 1초 간격 순차 노출 멘트(총 5개 권장)
}

export function LoadingIndicator({
  phase,
  activeAgents = [],
  completedAgents = [],
  messages,
}: LoadingIndicatorProps) {
  // 순차 멘트 처리: 1초마다 다음 멘트, 마지막 멘트에서 정지
  const defaultMessages = useMemo(
    () => [
      '우리 아이에 맞는 전문가 찾고 있어요!',
      '우리 아이 정보를 바탕으로 분석하고 있어요!',
      '관련 지식을 빠르게 탐색하고 있어요!',
      '최적의 답변 구성을 준비하고 있어요!',
      '곧 답변을 전달드릴게요!',
    ],
    []
  );
  const displayMessages = messages && messages.length > 0 ? messages : defaultMessages;
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    setMsgIndex(0);
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev < displayMessages.length - 1 ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [displayMessages]);

  const currentMsg = displayMessages[msgIndex] || displayMessages[0];
  if (phase === 'analyzing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start mb-4"
      >
        <div className="max-w-[85%] bg-muted rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🐶</span>
            <span className="text-sm font-semibold text-foreground">
              {currentMsg}
            </span>
          </div>
          <div className="w-full bg-muted-foreground/20 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === 'routing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start mb-4"
      >
        <div className="max-w-[85%] bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🤖</span>
            <span className="text-sm font-semibold text-foreground">
              {activeAgents.length}명의 전문가에게 전달했습니다
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{currentMsg}</p>
          <div className="space-y-2">
            {activeAgents.map((agentType) => {
              const config = getAgentConfig(agentType);
              return (
                <div key={agentType} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xl">{config.icon}</span>
                  <span className="text-sm text-muted-foreground">
                    {config.name} - 분석 중...
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === 'responding') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start mb-4"
      >
        <div className="max-w-[85%] bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💬</span>
            <span className="text-sm font-semibold text-foreground">
              전문가들의 답변
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{currentMsg}</p>
          <div className="space-y-3">
            {activeAgents.map((agentType) => {
              const config = getAgentConfig(agentType);
              const isCompleted = completedAgents.includes(agentType);

              return (
                <div key={agentType} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
                    )}
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {config.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isCompleted ? '✓' : '⏳ 작성 중...'}
                    </span>
                  </div>
                  {!isCompleted && (
                    <div className="w-full bg-muted-foreground/20 rounded-full h-1 overflow-hidden ml-6">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
