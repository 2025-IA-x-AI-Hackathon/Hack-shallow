'use client';

import { RetrievedDoc } from '@/lib/api';
import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface SourceCardProps {
  source: RetrievedDoc;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-md p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-2 text-left"
      >
        <FileText className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground truncate">
              {source.source}
            </h4>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {source.page && (
            <p className="text-xs text-muted-foreground mt-0.5">p.{source.page}</p>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            &quot;{source.snippet}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

interface SourceListProps {
  sources: RetrievedDoc[];
}

export function SourceList({ sources }: SourceListProps) {
  const [showAll, setShowAll] = useState(false);
  const displaySources = showAll ? sources : sources.slice(0, 2);
  const hasMore = sources.length > 2;

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          📚 참고 자료 ({sources.length})
        </span>
      </div>

      <div className="space-y-2">
        {displaySources.map((source, index) => (
          <SourceCard key={index} source={source} index={index} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:underline"
        >
          {showAll ? '접기' : `${sources.length - 2}개 더 보기`}
        </button>
      )}
    </div>
  );
}
