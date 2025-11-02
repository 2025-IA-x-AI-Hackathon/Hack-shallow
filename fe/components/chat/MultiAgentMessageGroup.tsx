'use client';

import { AgentResult } from '@/lib/api';
import { AgentResponseCard } from './AgentResponseCard';
import { motion } from 'framer-motion';

interface MultiAgentMessageGroupProps {
  results: AgentResult[];
  timestamp: string;
}

export function MultiAgentMessageGroup({ results, timestamp }: MultiAgentMessageGroupProps) {
  if (results.length === 0) return null;

  const totalDuration = results.reduce((sum, r) => sum + r.duration_ms, 0);
  const isGeneralOnly = results.length === 1 && results[0]?.agent === 'general';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-4"
    >
      <div className="max-w-[90%] w-full">
        {/* Group Header */}
        <div className="bg-card border border-border rounded-t-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{isGeneralOnly ? '😊' : '💬'}</span>
              <span className="text-sm font-semibold text-foreground">
                {isGeneralOnly ? '일반 상담 답변' : `${results.length}명의 전문가가 답변했습니다`}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Agent Responses */}
        <div className="bg-card border-x border-b border-border rounded-b-lg p-4 space-y-4 shadow-sm">
          {results.map((result, index) => (
            <div key={index}>
              <AgentResponseCard result={result} index={index} />
              {index < results.length - 1 && (
                <div className="my-4 border-t border-border" />
              )}
            </div>
          ))}

          {/* Total Response Time */}
          <div className="pt-3 border-t border-border">
            {/* <p className="text-xs text-muted-foreground text-right">
              전체 응답 시간: {(totalDuration / 1000).toFixed(2)}초
            </p> */}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
