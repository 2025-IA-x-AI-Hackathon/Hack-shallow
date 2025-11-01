'use client';

import { observer } from 'mobx-react-lite';
import { chatStore } from '@/stores/chatStore';

function DogSelector() {
  if (chatStore.dogs.length === 0) {
    return null;
  }

  // 강아지가 한 마리만 있는 경우 드롭다운 대신 이름만 표시
  if (chatStore.dogs.length === 1) {
    return (
      <div className="px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐕</span>
          <span className="text-sm font-medium text-foreground">
            {chatStore.currentDog?.name}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 bg-muted/50 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🐕</span>
        <select
          value={chatStore.currentDogId || ''}
          onChange={(e) => chatStore.setCurrentDog(Number(e.target.value))}
          className="flex-1 px-3 py-1.5 text-sm font-medium bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        >
          {chatStore.dogs.map((dog) => (
            <option key={dog.id} value={dog.id}>
              {dog.name} ({dog.breed})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default observer(DogSelector);
