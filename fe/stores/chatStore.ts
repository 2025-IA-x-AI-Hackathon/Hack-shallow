import { makeAutoObservable, runInAction } from 'mobx';
import { api, Dog, ChatMessage } from '@/lib/api';

class ChatStore {
  messages: ChatMessage[] = [];
  dogs: Dog[] = [];
  currentDogId: number | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async loadDogs(userId: number) {
    this.setLoading(true);
    this.error = null;
    try {
      const dogs = await api.getDogs(userId);
      runInAction(() => {
        this.dogs = dogs;
        // 첫 번째 강아지 자동 선택
        if (dogs.length > 0 && !this.currentDogId) {
          this.currentDogId = dogs[0].id;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : '강아지 목록을 불러오는데 실패했습니다.';
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async loadMessages() {
    if (!this.currentDogId) {
      this.error = '강아지를 선택해주세요.';
      return;
    }

    this.setLoading(true);
    this.error = null;
    try {
      const messages = await api.getChatMessages(this.currentDogId);
      runInAction(() => {
        this.messages = messages;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : '메시지를 불러오는데 실패했습니다.';
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async sendMessage(content: string) {
    if (!this.currentDogId) {
      this.error = '강아지를 선택해주세요.';
      return;
    }

    this.setLoading(true);
    this.error = null;

    // 낙관적 업데이트: 사용자 메시지 즉시 추가
    const optimisticMessage: ChatMessage = {
      id: Date.now(),
      dog_id: this.currentDogId,
      role: 'user',
      content,
      agent: null,
      created_at: new Date().toISOString(),
    };

    runInAction(() => {
      this.messages.push(optimisticMessage);
    });

    try {
      await api.sendChatMessage(this.currentDogId, content);
      // 메시지 전송 후 새로고침하여 AI 응답 받기
      await this.loadMessages();
    } catch (error) {
      // 실패 시 낙관적 메시지 제거
      runInAction(() => {
        this.messages = this.messages.filter(m => m.id !== optimisticMessage.id);
        this.error = error instanceof Error ? error.message : '메시지 전송에 실패했습니다.';
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  setCurrentDog(dogId: number) {
    this.currentDogId = dogId;
    this.messages = [];
    this.loadMessages();
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  clearMessages() {
    this.messages = [];
  }

  get currentDog(): Dog | null {
    return this.dogs.find(dog => dog.id === this.currentDogId) || null;
  }
}

export const chatStore = new ChatStore();
