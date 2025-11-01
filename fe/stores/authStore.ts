import { makeAutoObservable } from 'mobx';

class AuthStore {
  isAuthenticated = false;
  username: string | null = null;
  token: string | null = null;

  constructor() {
    makeAutoObservable(this);

    // localStorage에서 토큰 복원
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');
      const savedUsername = localStorage.getItem('auth_username');

      if (savedToken && savedUsername) {
        this.token = savedToken;
        this.username = savedUsername;
        this.isAuthenticated = true;
      }
    }
  }

  login(token: string, username: string) {
    this.token = token;
    this.username = username;
    this.isAuthenticated = true;

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_username', username);
    }
  }

  logout() {
    this.token = null;
    this.username = null;
    this.isAuthenticated = false;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_username');
    }
  }
}

export const authStore = new AuthStore();
