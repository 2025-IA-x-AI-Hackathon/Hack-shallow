import { makeAutoObservable } from 'mobx';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

class ChatStore {
  messages: Message[] = [];
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    this.messages.push(newMessage);
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  clearMessages() {
    this.messages = [];
  }
}

export const chatStore = new ChatStore();
