'use client';

import { observer } from 'mobx-react-lite';
import { DogInfoAutoFillUpdate } from '@/lib/api';

interface AutoFillNotificationProps {
  updates: DogInfoAutoFillUpdate[];
}

function AutoFillNotification({ updates }: AutoFillNotificationProps) {
  if (!updates || updates.length === 0) return null;

  const displayUpdates = updates.slice(0, 3);
  const remaining = updates.length - displayUpdates.length;
  const labels = displayUpdates.map(u => `${u.category}:${u.key}`).join(', ');

  return (
    <div className="text-xs text-muted-foreground/70 mt-1">
      정보 {updates.length}건 업데이트됨
      {/* {labels && `: ${labels}`}
      {remaining > 0 && ` 외 ${remaining}건`} */}
    </div>
  );
}

export default observer(AutoFillNotification);
