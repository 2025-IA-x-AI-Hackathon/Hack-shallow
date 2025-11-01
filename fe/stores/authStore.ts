import { makeAutoObservable, runInAction } from 'mobx';

class AuthStore {
  isAuthenticated = false;
  userId: number | null = null;
  username: string | null = null;
  token: string | null = null;
  isHydrated = false;

  constructor() {
    makeAutoObservable(this);
  }

  // Call this method from client-side only (useEffect)
  hydrate() {
    if (this.isHydrated || typeof window === 'undefined') return;

    const savedToken = localStorage.getItem('auth_token');
    const savedUserId = localStorage.getItem('auth_user_id');
    const savedUsername = localStorage.getItem('auth_username');

    if (savedToken && savedUserId && savedUsername) {
      runInAction(() => {
        this.token = savedToken;
        this.userId = parseInt(savedUserId, 10);
        this.username = savedUsername;
        this.isAuthenticated = true;
        this.isHydrated = true;
      });
    } else {
      runInAction(() => {
        this.isHydrated = true;
      });
    }
  }

  login(token: string, userId: number, username: string) {
    this.token = token;
    this.userId = userId;
    this.username = username;
    this.isAuthenticated = true;

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user_id', userId.toString());
      localStorage.setItem('auth_username', username);
    }
  }

  logout() {
    this.token = null;
    this.userId = null;
    this.username = null;
    this.isAuthenticated = false;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user_id');
      localStorage.removeItem('auth_username');
    }
  }
}

export const authStore = new AuthStore();
