'use client';

import { observer } from 'mobx-react-lite';
import { Info } from 'lucide-react';

interface AutoFillNotificationProps {
  updates: Array<{ category: string; key: string; value: string }>;
}

function AutoFillNotification({ updates }: AutoFillNotificationProps) {
  if (!updates || updates.length === 0) return null;

  const displayUpdates = updates.slice(0, 3);
  const remaining = updates.length - displayUpdates.length;

  return (
    <div className="flex justify-center my-2">
      <div className="max-w-[80%] px-4 py-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 animate-fade-in">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">강아지 정보 자동 업데이트 {updates.length}건</p>
            <div className="text-xs opacity-90 space-y-0.5">
              {displayUpdates.map((update, index) => (
                <div key={index}>
                  {update.category}:{update.key}
                </div>
              ))}
              {remaining > 0 && <div>외 {remaining}건</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default observer(AutoFillNotification);
