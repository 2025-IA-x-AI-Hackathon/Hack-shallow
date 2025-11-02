'use client';

import { AgentResult, api } from '@/lib/api';
import { chatStore } from '@/stores/chatStore';
import { getAgentConfig, getAgentColorClasses } from '@/lib/agentConfig';
import { SourceList } from './SourceCard';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface AgentResponseCardProps {
  result: AgentResult;
  index: number;
}

export function AgentResponseCard({ result, index }: AgentResponseCardProps) {
  const config = getAgentConfig(result.agent);
  const colorClasses = getAgentColorClasses(config.color);
  const [isDownloading, setIsDownloading] = useState(false);

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function mdToHtml(md: string) {
    if (!md) return '';
    let out = md;
    // code fences
    out = out.replace(/```([\s\S]*?)```/g, (_: string, code: string) => `<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    // inline code
    out = out.replace(/`([^`]+)`/g, (_: string, code: string) => `<code>${escapeHtml(code)}</code>`);
    // headings
    out = out.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    out = out.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    out = out.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    // bold / italic (basic)
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // links
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // paragraphs
    out = out
      .split(/\n\n+/)
      .map((block: string) => {
        if (/^<h[1-3]>/.test(block) || /^<pre>/.test(block)) return block;
        return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
      })
      .join('\n');
    return out;
  }

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

      {/* Answer Content (Markdown) */}
      <div
        className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: mdToHtml(result.answer) }}
      />

      {/* Report Agent: Download Button */}
      {result.agent === 'report' && (
        <div className="mt-3">
          <button
            className={`px-3 py-2 rounded-md text-xs font-semibold ${colorClasses.bg} flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
            onClick={async () => {
              try {
                const dogId = chatStore.currentDogId;
                if (!dogId || isDownloading) return;
                setIsDownloading(true);
                const r = await api.createReportMarkdown(dogId);
                window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${r.url_pdf}`, '_blank');
              } catch (e) {
                console.error(e);
                alert('보고서 생성 실패');
              } finally {
                setIsDownloading(false);
              }
            }}
            disabled={isDownloading}
            aria-busy={isDownloading}
            aria-live="polite"
          >
            {isDownloading && (
              <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
            )}
            {isDownloading ? '보고서 생성 중...' : '보고서(PDF) 다운로드'}
          </button>
        </div>
      )}

      {/* Retrieved Sources */}
      {result.retrieved_docs && result.retrieved_docs.length > 0 && (
        <SourceList sources={result.retrieved_docs} />
      )}

      {/* Response Time */}
      <div className="mt-3 pt-2 border-t border-border">
        {/* <p className="text-xs text-muted-foreground">
          응답 시간: {(result.duration_ms / 1000).toFixed(2)}초
        </p> */}
      </div>
    </motion.div>
  );
}
