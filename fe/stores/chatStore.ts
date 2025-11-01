import { makeAutoObservable, runInAction } from 'mobx';
import { api, Dog, ChatMessage, AgentResult } from '@/lib/api';

export type LoadingPhase = 'analyzing' | 'routing' | 'responding' | null;

class ChatStore {
  messages: ChatMessage[] = [];
  dogs: Dog[] = [];
  currentDogId: number | null = null;
  isLoading = false;
  loadingPhase: LoadingPhase = null;
  activeAgents: string[] = [];
  completedAgents: string[] = [];
  error: string | null = null;

  // Store multi-agent results temporarily
  pendingResults: AgentResult[] | null = null;

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

    // 낙관적 업데이트: 사용자 메시지 UI에 즉시 추가
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
      this.loadingPhase = 'analyzing';
    });

    try {
      // Step 1: 사용자 메시지를 DB에 저장 (frontend.html의 라인 510과 동일)
      const savedUserMessage = await api.sendChatMessage(
        this.currentDogId,
        content,
        'user',
        null
      );

      // 낙관적 메시지를 실제 저장된 메시지로 교체
      runInAction(() => {
        const index = this.messages.findIndex(m => m.id === optimisticMessage.id);
        if (index !== -1) {
          this.messages[index] = savedUserMessage;
        }
      });

      // Phase 1: Analyzing
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: 멀티 에이전트 응답 생성 요청 (frontend.html의 라인 527-534와 동일)
      // /v1/api/message 엔드포인트 호출 - DB에 저장하지 않고 실시간 응답만 반환
      const response = await api.sendMultiAgentMessage(content, this.currentDogId);

      // Phase 2: Routing
      runInAction(() => {
        this.loadingPhase = 'routing';
        this.activeAgents = response.results.map(r => r.agent);
        this.completedAgents = [];
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      // Phase 3: Responding (simulate progressive completion)
      runInAction(() => {
        this.loadingPhase = 'responding';
      });

      // Simulate agents completing one by one
      for (let i = 0; i < response.results.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        runInAction(() => {
          this.completedAgents = response.results.slice(0, i + 1).map(r => r.agent);
        });
      }

      // Store results temporarily for UI display
      runInAction(() => {
        this.pendingResults = response.results;
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: 에이전트별 응답을 DB에 저장 (frontend.html의 라인 538-551과 동일)
      const savedMessages: ChatMessage[] = [];
      for (const result of response.results) {
        try {
          // 텍스트 답변만 저장 (frontend.html과 동일)
          const savedMsg = await api.sendChatMessage(
            this.currentDogId,
            result.answer,
            'assistant',
            result.agent
          );
          savedMessages.push(savedMsg);
        } catch (error) {
          console.error('Failed to save agent message:', error);
        }
      }

      // Add saved messages to local state
      runInAction(() => {
        this.messages.push(...savedMessages);
      });
    } catch (error) {
      // 실패 시 낙관적 메시지 제거
      runInAction(() => {
        this.messages = this.messages.filter(m => m.id !== optimisticMessage.id);
        this.error = error instanceof Error ? error.message : '메시지 전송에 실패했습니다.';
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
        this.loadingPhase = null;
        this.activeAgents = [];
        this.completedAgents = [];
        // pendingResults를 유지하여 사용자가 버튼을 눌러 보고서 다운로드 가능하도록 함
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
