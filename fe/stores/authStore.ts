import { makeAutoObservable } from 'mobx';

class AuthStore {
  isAuthenticated = false;
  user: { id: string; name: string; email: string } | null = null;
  token: string | null = null;

  constructor() {
    makeAutoObservable(this);

    // localStorage에서 토큰 복원
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');

      if (savedToken && savedUser) {
        this.token = savedToken;
        this.user = JSON.parse(savedUser);
        this.isAuthenticated = true;
      }
    }
  }

  login(token: string, user: { id: string; name: string; email: string }) {
    this.token = token;
    this.user = user;
    this.isAuthenticated = true;

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }
}

export const authStore = new AuthStore();
