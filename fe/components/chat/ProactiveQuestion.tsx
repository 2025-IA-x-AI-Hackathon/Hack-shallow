'use client';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { chatStore } from '@/stores/chatStore';
import { DogInfoRandomQuestion, api } from '@/lib/api';

interface ProactiveQuestionProps {
  question: DogInfoRandomQuestion;
}

export const ProactiveQuestion = observer(({ question }: ProactiveQuestionProps) => {
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (answer: string) => {
    setIsSubmitting(true);
    try {
      if (!chatStore.currentDogId) {
        console.error('No dog selected');
        return;
      }

      // Save answer to DogInfo backend only (not as chat message)
      await api.saveDogInfoAnswer(chatStore.currentDogId, question.key, answer);

      // Clear proactive question and update timestamp
      chatStore.clearProactiveQuestion();
      chatStore.updateLastConversationTimestamp();
    } catch (error) {
      console.error('Failed to save answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBooleanAnswer = (value: boolean) => {
    handleSubmit(value ? 'Yes' : 'No');
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textAnswer.trim()) {
      handleSubmit(textAnswer);
      setTextAnswer('');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diet':
        return '🍖';
      case 'behavior':
        return '🐕';
      default:
        return '💬';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'diet':
        return '식사 정보';
      case 'behavior':
        return '행동 정보';
      default:
        return category;
    }
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] bg-muted rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{getCategoryIcon(question.category)}</span>
          <span className="text-sm font-semibold text-muted-foreground">
            {getCategoryLabel(question.category)}
          </span>
        </div>
        <p className="text-foreground whitespace-pre-wrap mb-3">{question.question}</p>

        {question.question_type === 'boolean' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleBooleanAnswer(true)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              네
            </button>
            <button
              onClick={() => handleBooleanAnswer(false)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              아니오
            </button>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={isSubmitting}
              placeholder="답변을 입력해주세요..."
              className="flex-1 px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting || !textAnswer.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </form>
        )}

        <span className="text-xs text-muted-foreground mt-2 block">
          {new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
});

ProactiveQuestion.displayName = 'ProactiveQuestion';
