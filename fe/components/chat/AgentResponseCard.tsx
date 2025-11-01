'use client';

import { AgentResult } from '@/lib/api';
import { getAgentConfig, getAgentColorClasses } from '@/lib/agentConfig';
import { SourceList } from './SourceCard';
import { motion } from 'framer-motion';

interface AgentResponseCardProps {
  result: AgentResult;
  index: number;
}

export function AgentResponseCard({ result, index }: AgentResponseCardProps) {
  const config = getAgentConfig(result.agent);
  const colorClasses = getAgentColorClasses(config.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className={`border-l-4 ${colorClasses.border} bg-muted/30 rounded-r-lg p-4`}
    >
      {/* Agent Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full ${colorClasses.bg} flex items-center justify-center`}>
          <span className="text-lg">{config.icon}</span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{config.name}</h4>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Answer Content */}
      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {result.answer}
      </div>

      {/* Retrieved Sources */}
      {result.retrieved_docs && result.retrieved_docs.length > 0 && (
        <SourceList sources={result.retrieved_docs} />
      )}

      {/* Response Time */}
      <div className="mt-3 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          응답 시간: {(result.duration_ms / 1000).toFixed(2)}초
        </p>
      </div>
    </motion.div>
  );
}
